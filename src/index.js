const app=require('./app')
const http=require('http')
const socketio=require('socket.io')
const Filter=require('bad-words')
const {generateMessage, generateLocationMessage}=require('./utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom}=require('./utils/users')

const server=http.createServer(app)
const port=process.env.PORT
const io=socketio(server)
io.on('connection',(socket)=>{
    console.log('someone connected')

    socket.on('join',(options,callback)=>{
        const{error,user}=addUser({
            id:socket.id,
            ...options
        })

        if(error){
            return callback(error)
        }
        socket.join(user.room)
        
        io.to(user.room).emit('message',generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message',generateMessage(user.username,`${user.username} has joined!`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        callback()
        //socket.emit, io.emit, socket.broadcast.emit
        //io.to.emit, socket.broadcast.to.emit
    })

    socket.on('sendMessage',(message,callback)=>{
        const filter=new Filter()
        const user=getUser(socket.id)
        if(user){
            if(filter.isProfane(message)){
                return callback('Projanity is not allowed!')
            }
            io.to(user.room).emit('message',generateMessage(user.username,message))
            callback('Delivered!')
        }
    })

    socket.on('disconnect',()=>{
        const u=getUser(socket.id)
        const user = removeUser(socket.id)
        if(user){
            io.to(u.room).emit('message',generateMessage('Admin',`${u.username} has left`))
            io.to(u.room).emit('roomData',{
                room:u.room,
                users:getUsersInRoom(u.room)
            })
        }
        
    })

    socket.on('sendLocation',(coords,callback)=>{
        const user=getUser(socket.id)
        if(user){
            io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longtitude}`))
            callback()
        }
    })    
})

server.listen(port,()=>{
    console.log('Server is up on '+port)
})
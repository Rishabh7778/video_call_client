import React, { useEffect, useState } from 'react';
import { useSocket } from '../provider/Socket';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    const { socket } = useSocket();

    const [email, setEmail] = useState('');
    const [roomId, setRoomId] = useState('');

    const handleJoinRoom = () => {
        if (!email || !roomId) {
            alert("Please enter both email and room ID");
            return;
        }
        socket.emit("join-room", { emailId: email, roomId });
    };

    useEffect(() => {
        const handleRoomJoined = ({ roomId }) => {
            if (roomId) {
                navigate(`/room/${roomId}`);
            }
        };

        socket.on('joined-room', handleRoomJoined);

        return () => {
            socket.off('joined-room', handleRoomJoined); 
        };
    }, [socket, navigate]);

    return (
        <div className='mt-40'>
            <div className="max-w-sm mx-auto">
                <div className="mb-5">
                    <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900">Your email</label>
                    <input 
                        type="email" 
                        id="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" 
                        placeholder="name@example.com" 
                        autoComplete='off' 
                        required 
                    />
                </div>
                <div className="mb-5">
                    <label htmlFor="roomId" className="block mb-2 text-sm font-medium text-gray-900">Room Id</label>
                    <input 
                        type="text" 
                        id="roomId" 
                        value={roomId} 
                        onChange={e => setRoomId(e.target.value)} 
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" 
                        placeholder="Enter Room ID" 
                        autoComplete='off' 
                        required 
                    />
                </div>

                <button 
                    type="submit" 
                    onClick={handleJoinRoom} 
                    className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center"
                >
                    Submit
                </button>
            </div>
        </div>
    );
};

export default Home;

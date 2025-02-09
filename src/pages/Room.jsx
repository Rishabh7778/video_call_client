import React, { useEffect, useCallback, useState } from 'react';
import ReactPlayer from 'react-player';
import { useSocket } from '../provider/Socket';
import { usePeer } from '../provider/Peers';
import { useNavigate } from 'react-router-dom';

const RoomPage = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { 
    peer, 
    createOffer, 
    createAnswer, 
    setRemoteAns, 
    sendStream, 
    remoteStream, 
    endCall  // imported from PeerProvider
  } = usePeer();

  const [mystream, setMyStream] = useState(null);
  const [remoteEmailId, setRemoteEmailId] = useState(null);
  const [callEnded, setCallEnded] = useState(false);

  const handleNewUserJoined = useCallback(async (data) => {
    const { emailId } = data;
    console.log('New user joined room', emailId);
    const offer = await createOffer();
    socket.emit('call-user', { emailId, offer });
    setRemoteEmailId(emailId);
  }, [createOffer, socket]);

  const handleIncomingCall = useCallback(async (data) => {
    const { from, offer } = data;
    console.log('Incoming Call from', from, offer);
    if (!from || !offer) {
      console.log("Invalid call data received", data);
      return;
    }
    const ans = await createAnswer(offer);
    console.log("Sending call-accept to:", from, "with ans:", ans);
    socket.emit('call-accept', { emailId: from, ans });
    setRemoteEmailId(from);
  }, [createAnswer, socket]);

  const handleCallAccept = useCallback(async (data) => {
    console.log("Received call-accept event", data);
    if (!data || !data.ans) {
      console.log("No valid answer received!");
      return;
    }
    const { ans } = data;
    console.log("Setting remote answer:", ans);
    await setRemoteAns(ans);
  }, [setRemoteAns]);

  const getUserMediaStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setMyStream(stream);
    } catch (err) {
      console.error("Error accessing media devices.", err);
    }
  }, []);

  // Socket.IO event listeners
  useEffect(() => {
    socket.on('user-joined', handleNewUserJoined);
    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-accept', handleCallAccept);

    // Updated 'end-call' listener receives the endedBy information
    socket.on('end-call', (data) => {
      const endedBy = data?.endedBy;
      if (endedBy) {
        console.log(`Call ended by ${endedBy}`);
      } else {
        console.log("Call ended");
      }
      endCall();
      setRemoteEmailId(null);
      setCallEnded(true);
    });

    return () => {
      socket.off('user-joined', handleNewUserJoined);
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-accept', handleCallAccept);
      socket.off('end-call');
    };
  }, [socket, handleNewUserJoined, handleIncomingCall, handleCallAccept, endCall]);

  // Negotiation-needed handler (if needed)
  const handleNegosiation = useCallback(() => {
    const localOffer = peer.localDescription;
    socket.emit('call-user', { emailId: remoteEmailId, offer: localOffer });
  }, [peer.localDescription, remoteEmailId, socket]);

  useEffect(() => {
    peer.addEventListener('negotiationeeded', handleNegosiation);
    return () => {
      peer.removeEventListener('negotiationeeded', handleNegosiation);
    }
  }, [handleNegosiation, peer]);

  useEffect(() => {
    getUserMediaStream();
  }, [getUserMediaStream]);

  // Handler to send stream to the remote peer
  const handleConnectUser = () => {
    if (mystream && remoteEmailId) {
      sendStream(mystream, socket, remoteEmailId);
    }
  };

  // "End Call" button handler sends your email along with the event and updates callEnded state
  const handleEndCall = () => {
    if (remoteEmailId) {
      socket.emit('end-call', { emailId: remoteEmailId });
      endCall();
      setRemoteEmailId(null);
      setCallEnded(true);
      console.log("You ended the call");
    }
  };

  const handleBack = () => {
    navigate('/');
  }

  if (callEnded) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-blue-100">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">Call is Ended</h1>
        <button 
          onClick={handleBack} 
          className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none"
        >
          Back to Home
        </button>
      </div>
    );
  }
  

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-4xl font-bold mb-4 text-gray-800">Room Page</h1>
      <h4 className="text-xl mb-6 text-gray-600">
        You are connected to {remoteEmailId ? remoteEmailId : "No one"}
      </h4>
      <div className="flex space-x-4 mb-8">
        <button 
          onClick={handleConnectUser} 
          disabled={!mystream || !remoteEmailId}
          className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 focus:outline-none"
        >
          Connect User
        </button>
        <button 
          onClick={handleEndCall} 
          disabled={!remoteEmailId}
          className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 focus:outline-none"
        >
          End Call
        </button>
      </div>
      <div className="flex flex-col md:flex-row w-full justify-center gap-6">
        <div className="w-full md:w-1/2 bg-white shadow-lg rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3 text-gray-700">My Stream</h2>
          <ReactPlayer url={mystream} playing muted width="100%" height="auto" className="rounded-md" />
        </div>
        <div className="w-full md:w-1/2 bg-white shadow-lg rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3 text-gray-700">Remote Stream</h2>
          <ReactPlayer url={remoteStream} playing width="100%" height="auto" className="rounded-md" />
        </div>
      </div>
    </div>
  );
};

export default RoomPage;

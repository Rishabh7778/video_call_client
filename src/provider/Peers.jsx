import React, { useCallback, useEffect, useState } from 'react';

const PeerContext = React.createContext(null);

export const usePeer = () => React.useContext(PeerContext);

// Function to create a new RTCPeerConnection with required configuration
const createPeerConnection = () => {
  return new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:global.stun.twilio.com:3478"
        ],
      },
    ],
  });
};

export const PeerProvider = (props) => {
  // Using state so that we can update the peer connection later
  const [peer, setPeer] = useState(createPeerConnection());
  const [remoteStream, setRemoteStream] = useState(null);

  const createOffer = async () => {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    return offer;
  };

  const createAnswer = async (offer) => {
    await peer.setRemoteDescription(offer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    return answer;
  };

  const setRemoteAns = async (ans) => {
    await peer.setRemoteDescription(ans);
  };

  const sendStream = async (stream, socket, remoteEmailId) => {
    if (!stream) {
      console.error("No stream available to send!");
      return;
    }
    const existingTracks = peer.getSenders().map(sender => sender.track);
    stream.getTracks().forEach(track => {
      if (!existingTracks.includes(track)) {
        peer.addTrack(track, stream);
      }
    });
    // Create a new offer after adding the stream
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket.emit('call-user', { emailId: remoteEmailId, offer });
  };

  // Handler for incoming remote track events
  const handleTrackEvent = useCallback((e) => {
    const streams = e.streams;
    setRemoteStream(streams[0]);
  }, []);

  useEffect(() => {
    peer.addEventListener('track', handleTrackEvent);
    return () => {
      peer.removeEventListener('track', handleTrackEvent);
    };
  }, [peer, handleTrackEvent]);

  // End the current call by closing the peer connection
  const endCall = () => {
    if (peer) {
      peer.close();
    }
    setRemoteStream(null);
  };

  // Reset/reinitialize the peer connection so the user can reconnect
  const resetPeer = () => {
    if (peer) {
      peer.close();
    }
    const newPeer = createPeerConnection();
    newPeer.addEventListener('track', handleTrackEvent);
    setPeer(newPeer);
  };

  return (
    <PeerContext.Provider
      value={{
        peer,
        createOffer,
        createAnswer,
        setRemoteAns,
        sendStream,
        remoteStream,
        endCall,
        resetPeer,
      }}
    >
      {props.children}
    </PeerContext.Provider>
  );
};

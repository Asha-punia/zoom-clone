import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import "./VideoMeet.css";

const socket = io("http://localhost:8000");

export default function VideoMeet() {
    const pcRef = useRef(null);
    const pendingCandidateRef = useRef([]);
    let localVideoRef = useRef(null);
    let remoteVideoRef = useRef(null);
    let [username, setUsername] = useState("");
    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);
    let [isMuted, setIsMuted] = useState(false);
    let [isCameraOn, setIsCameraOn] = useState(true);
    let [inCall, setInCall] = useState(false);
    let [screenAvailable, setScreenAvaiable] = useState();
    let [video, setVideo] = useState([]);
    let [audio, setAudio] = useState();
    let [screen, setScreen] = useState();
    let [roomId, setRoomId] = useState("");
    let [message, setMessage] = useState("");
    let [messages, setMessages] = useState([]);


    const getPermissions = async () => {
        try {
            const pc = pcRef.current;
            //Video and Audio
            const userMediaStream = await navigator.mediaDevices.getUserMedia({video : true, audio : true});
            setVideoAvailable(true);
            setAudioAvailable(true);
         
            //Screen Sharing
            if(navigator.mediaDevices.getDisplayMedia) {
                setScreenAvaiable(true);
            }else {
                setScreenAvaiable(false);
            }
            //stream
            window.localStream = userMediaStream;
            localVideoRef.current.srcObject = userMediaStream;

            userMediaStream.getTracks().forEach((track) => {
                pc.addTrack(track, userMediaStream);
            });

        }catch(err) {
            setVideoAvailable(false);
            setAudioAvailable(false);            
            console.log("Streaming Failed!", err);
        }
    }

    const createPeerConnection = () => {
        pcRef.current = new RTCPeerConnection({
            iceServers : [
                { urls : "stun:stun.l.google.com:19302" }
            ]
        });
        pcRef.current.ontrack = (event) => {
            const remoteMediaStream = event.streams[0];
            if(remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteMediaStream;
            }
        }  
        //send ice-candidate

        pcRef.current.onicecandidate = (event) => {
            if(event.candidate) {
                socket.emit("ice-candidate", event.candidate);
            }
        }
          
    }

    //Socket connected
    useEffect(() => {
        if (socket.connected) {
            console.log("connected!", socket.id);
        }

        const onConnect = () => {
            console.log("connected!", socket.id);
        };

        socket.on("connect", onConnect);
        return () => {
            socket.off("connect", onConnect);
        };

    }, []);

    const joinRoom = async () => {
        try {
            if(!roomId.trim()) {
                alert("Enter valid Room-Id!");
                return;
            }
            if(socket.connected) {
                socket.emit("room-id", roomId);
            }else {
                socket.connect();
                socket.once("connect", () => {
                    socket.emit("room-id", roomId);
                });
            }
        }catch(e) {
            console.log("error occured!", e);
        }
    }

    const createOffer = async () => {
        try {
            createPeerConnection();
            const pc = pcRef.current;
            await getPermissions();
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("offer", offer);
            setInCall(true);
        }catch(e) {
            console.log("Error while creating offfer", e);
        }
    }
    //mute/unmute
    const toggleMute = () => {
        const audioTrack = window.localStream.getAudioTracks()[0];
        audioTrack.enabled = !(audioTrack.enabled);
        setIsMuted(!audioTrack.enabled);
    }
    //camera on/off
    const toggleCameraState = () => {
        const videoTrack = window.localStream.getVideoTracks()[0];
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
    }
    //leave meeting
    const leaveMeeting = () => {
        window.localStream.getTracks().forEach((track) => {
            track.stop();
        });
        localVideoRef.current.srcObject = null;

        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }

        window.localStream = null;

        pcRef.current.close();
        socket.disconnect();
        setInCall(false);
    }
    //Screen Sharing
    const shareScreen = async () => {
        try {
            //A sender is a pipeline. The track is the source flowing through that pipeline. replaceTrack() changes the source, not the pipeline.
            const screenStream = await navigator.mediaDevices.getDisplayMedia({video : true});
            localVideoRef.current.srcObject = screenStream;
            const screenTrack = screenStream.getVideoTracks()[0];
            const videoSender = pcRef.current.getSenders().find((sender) => sender.track.kind === "video");
            await videoSender.replaceTrack(screenTrack);
            screenTrack.onended = async () => {
                const screenSender = pcRef.current.getSenders().find((sender) => sender.track.kind === "video");
                const videoTrack = window.localStream.getVideoTracks()[0];
                await screenSender.replaceTrack(videoTrack);
                localVideoRef.current.srcObject = window.localStream;
            }
        }catch(e) {
            console.log("screen sharing failed!", e);
        }
    }
    //Chat Section
    const sendMessage = () => {
        socket.emit("chat-message", {
            username,
            message,
        });
    }
    useEffect(() => {
        const handleMessage = (data) => {
            setMessages((prevData) => [...prevData, data]);
        }
        socket.on("chat-message", handleMessage);
        return () => {
            socket.off("chat-message", handleMessage);
        }
    }, []);

    useEffect(() => {
        const handleAnswer = async (answer) => {
            const pc = pcRef.current;
            if(!pc) {
                return;
            }
            if (pc.signalingState !== "have-local-offer") {
                return;
            }
            await pc.setRemoteDescription(
                new RTCSessionDescription(answer)
            );
            while(pendingCandidateRef.current.length > 0) {
                const candidate = pendingCandidateRef.current.shift();
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }

        }
        socket.on("answer", handleAnswer);
        return () => {
            socket.off("answer", handleAnswer);
        };
    }, []);

    useEffect(() => {
            const handleOffer = async (offer) => {
                if(!pcRef.current) {
                    createPeerConnection();
                    await getPermissions();
                }
                const pc = pcRef.current;
                await pc.setRemoteDescription(
                    new RTCSessionDescription(offer)
                );
                while(pendingCandidateRef.current.length > 0) {
                    const candidate = pendingCandidateRef.current.shift();
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit("answer", answer);
                setInCall(true);
            }
            socket.on("offer", handleOffer);
            return () => {
                socket.off("offer", handleOffer);
            }
    }, []);        

        //ice-candidate

        useEffect(() => {
            //receive ice-candidate

            const handleCandidate = async (candidate) => {
            try {
                const pc = pcRef.current;
                if(!pc) {
                    return;
                }
                if(!pc.remoteDescription) {
                    pendingCandidateRef.current.push(candidate);
                    return;
                }
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }catch (err) {
                console.log("Error adding ice candidate", err);
            }
            }

            socket.on("ice-candidate", handleCandidate);

            //cleanup

            return () => {
                socket.off("ice-candidate", handleCandidate);
            }

        }, []);        



    return (
        <>
            
            {inCall ? (
                <>
                    <Button variant="contained" onClick={toggleMute} >{isMuted ? "Unmute" : "Mute"}</Button>
                    <Button variant="contained" style={{marginLeft: "10px"}} onClick={toggleCameraState}>{isCameraOn ? "Turn Camera Off" : "Turn Camera On"}</Button>
                    <Button variant="contained" style={{marginLeft:"10px"}} onClick={leaveMeeting}>Leave</Button>
                    <Button variant="contained" style={{marginLeft: "10px"}} onClick={shareScreen}>Screen Share</Button>
                    <TextField id="chat" label="chat" variant="outlined" value={message} onChange={(e) => setMessage(e.target.value)}></TextField>
                    <Button variant="contained" style={{marginLeft:"10px"}} onClick={sendMessage}>Send</Button>

                </>
            ) :
            (
                <>
                    <h2> LOBBY </h2>
                    <TextField id="username" label="Username" variant="outlined" value={username} onChange={(e) => setUsername(e.target.value)} /><br/><br />
                    <TextField id="roomId" label="Room-Id" variant="outlined" value={roomId} onChange={(e) => setRoomId(e.target.value)} /><br/><br />
                    <Button variant="contained" onClick={joinRoom}>Join-Room</Button>
                    <Button variant="contained" style={{ marginLeft: "10px" }} onClick={createOffer}>Connect</Button>
                </>
            )}
            <div>
                {messages.map((msg) => {
                    return (
                    <div><b>{msg.username}</b> : {msg.message}</div>
                    );
                })}
            </div>
            <div>
                <div>
                    <video ref={localVideoRef} autoPlay muted></video>
                </div>
                <div>
                    <video ref={remoteVideoRef} autoPlay playsInline></video>
                </div>
            </div>

            

        </>
    );
}
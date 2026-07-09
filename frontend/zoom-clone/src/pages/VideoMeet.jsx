import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import "./VideoMeet.css";

const socket = io("http://localhost:8000");

export default function VideoMeet() {
    const pcRef = useRef(null);
    let localVideoRef = useRef(null);
    let remoteVideoRef = useRef(null);
    let [username, setUsername] = useState("");
    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);
    let [screenAvailable, setScreenAvaiable] = useState();
    let [video, setVideo] = useState([]);
    let [audio, setAudio] = useState();
    let [screen, setScreen] = useState();
    let [roomId, setRoomId] = useState("");


    const getPermissions = async () => {
        try {
            const pc = pcRef.current;
            //Video
            const videoPermission = await navigator.mediaDevices.getUserMedia({video : true});
            if(videoPermission) {
                setVideoAvailable(true);
            }else {
                setVideoAvailable(false);
            } 
            //Audio
            const audioPermission = await navigator.mediaDevices.getUserMedia({audio : true});
            if(audioPermission) {
                setAudioAvailable(true);
            }else {
                setAudioAvailable(false);
            }
            //Screen Sharing
            if(navigator.mediaDevices.getDisplayMedia) {
                setScreenAvaiable(true);
            }else {
                setScreenAvaiable(false);
            }
            //stream
            if(videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({video : videoAvailable, audio : audioAvailable});
                if(userMediaStream) {
                    window.localStream = userMediaStream;
                    localVideoRef.current.srcObject = userMediaStream;
                    userMediaStream.getTracks().forEach((track) => {
                        pc.addTrack(track, userMediaStream);
                    });
                }
            }
        }catch(err) {
            console.log("Streaming Failed!", err);
        }
    }

    useEffect(() => {
        pcRef.current = new RTCPeerConnection({
            iceServers : [
                { urls : "stun:stun.l.google.com:19302" }
            ]
        });
        pcRef.current.ontrack = (event) => {
            console.log("TRACK RECEIVED!", event);
            const remoteMediaStream = event.streams[0];
            if(remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteMediaStream;
            }
        }
    }, []);

    useEffect(() => {
        getPermissions();
    }, []);

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
            socket.emit("room-id", roomId);
        }catch(e) {
            console.log("error occured!", e);
        }
    }

    const createOffer = async () => {
        try {
            const pc = pcRef.current;
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("offer", offer);
        }catch(e) {
            console.log("Error while creating offfer", e);
        }
    }

    useEffect(() => {
        const pc = pcRef.current;
        const handleAnswer = async (answer) => {
            if (pc.signalingState !== "have-local-offer") {
                return;
            }
            await pc.setRemoteDescription(
                new RTCSessionDescription(answer)
            );
        }
        socket.on("answer", handleAnswer);
        return () => {
            socket.off("answer", handleAnswer);
        };
    }, [])

    useEffect(() => {
        const pc = pcRef.current;
        const handleOffer = async (offer) => {
            // await getPermissions();
            await pc.setRemoteDescription(
                new RTCSessionDescription(offer)
            );
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("answer", answer);
        }
        socket.on("offer", handleOffer);
        return () => {
            socket.off("offer", handleOffer);
        }
    }, []);

    //ice-candidate

    useEffect(() => {
        const pc = pcRef.current;

        //send ice-candidate

        pc.onicecandidate = (event) => {
            if(event.candidate) {
                socket.emit("ice-candidate", event.candidate);
                console.log("Sending ice candidate", event.candidate);
            }
        }
        
        //receive ice-candidate

        const handleCandidate = async (candidate) => {
           try {
                await pc.addIceCandidate(candidate);
                console.log("ice-candidate added!", candidate);
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
            <h2> LOBBY </h2>
            <TextField id="username" label="Username" variant="outlined" value={username} onChange={(e) => setUsername(e.target.value)} /><br/><br />
            <TextField id="roomId" label="Room-Id" variant="outlined" value={roomId} onChange={(e) => setRoomId(e.target.value)} /><br/><br />
            <Button variant="contained" onClick={joinRoom}>Join-Room</Button>
            <Button variant="contained" style={{ marginLeft: "10px" }} onClick={createOffer}>Connect</Button>

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
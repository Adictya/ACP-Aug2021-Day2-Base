var client = AgoraRTC.createClient({
    mode: 'rtc',
    codec: 'vp8'
})

var options = {
    appid: '1e6816ded05149088f32daa1c0d19456',
    uid: null,
    channel: null,
}

var localTracks = {
    videoTrack : null,
    audioTrack : null,
}

var remoteUsers = {}

async function join(){

    client.on("user-joined",handleUserJoined);
    client.on("user-published",handleUserPublished);
    client.on("user-left",handleUserLeft);

    options.uid = await client.join(options.appid,options.channel,null,null)

    localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();


    localTracks.videoTrack.play("local-player")

    await client.publish(Object.values(localTracks))
}

function handleUserJoined(user){
    const id = user.uid;
    remoteUsers[id] = user;
}

function handleUserPublished(user , mediaType){
    subscribe(user,mediaType);
}

async function subscribe(user, mediaType){
    const id = user.uid;

    await client.subscribe(user, mediaType);
    console.log("Subscribed to user:"+ id);

    if(mediaType == 'video'){
        const remotePlayer = $(`
            <div id="player-wrapper-${id}">
            <p class="player-name"> remoteUser${id} </p>
            <div id="player-${id}" class="player"></div>
            </div>
        `)

        $("#remote-playerlist").append(remotePlayer);

        user.videoTrack.play(`player-${id}`)

    } else if (mediaType == 'audio'){
        user.audioTrack.play();
    }


}

function handleUserLeft(user){
    const id = user.uid;
    delete remoteUsers[id];

    $(`#player-wrapper-${id}`).remove();
}

$("#join-form").submit(async function(e){
    e.preventDefault();

    options.channel = $("#channel").val();

    try{
        join();
    }catch (e){
        console.error(e)
    }finally{
        $("#join").attr("disabled", true)
        $("#leave").attr("disabled", false)
    }

})

async function leave(){

    for(trackName in localTracks){
        var track = localTracks[trackName];
        if (track) {
            track.stop();
            track.close();
            localTracks.trackName = undefined;
        }
    }

    $("#join").attr("disabled", false)
    $("#leave").attr("disabled", true)

    remoteUsers = {}

    $(`#remote-playerlist`).html("");

    await client.leave();
}

$('#leave').click(function(e){
    leave();
})
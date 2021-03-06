
(async function ($) {
    "use strict";

    if(localStorage.getItem("enable-sound") == "checked") {
        localStorage.setItem("enable-sound", "");
    }

    $("[name=enable-sound]").change((el) => {
        if(Notification.permission !== "granted") {
            Notification.requestPermission();
            el.currentTarget.checked = false;
            return;
        }
        localStorage.setItem("enable-sound",el.currentTarget.checked ? "checked" : "");
    });
    
    var res = await fetch(url);
    var json = await res.json();
    latest_snapshot = json.latest.snapshot;
    
    var loop = setInterval(async function () {
        var res = await fetch(url);
        var json = await res.json();
        if(FlawCraLIB.getParameterByName("snap", location.href)) {
            var snapshot = FlawCraLIB.getParameterByName("snap", location.href);
            if(await check(json, snapshot)) {
                livetext.innerText = live_now;
                latest.innerText = `Selected snapshot: ${snapshot}`;
                snapshot_live_event(snapshot);
                clearInterval(loop);
                return;
            } else {
                livetext.innerText = not_live;
                latest.innerText = `Selected snapshot: ${snapshot}`;
                return;
            }
            
        }

        if(await check(json)) {
            livetext.innerText = live_now;
            latest_snapshot = json.latest.snapshot;
            latest.innerText = `Latest snapshot: ${latest_snapshot}`;
            snapshot_live_event(latest_snapshot);
            add_phoenix_stream();
            clearInterval(loop);
        } else {
            livetext.innerText = not_live;
            latest.innerText = `Latest snapshot: ${json.latest.snapshot}`;
        }
    }, 1500);

    var add_phoenix_stream = async () => {
        var phoenix_live = await is_phoenix_live();
        if(phoenix_live && (new Date() <= new Date(latest_snapshot_released.getFullYear(), latest_snapshot_released.getMonth(), latest_snapshot_released.getDate()+5))) {
            phoenix_stream.innerHTML = `Phoenix SC is currently live! He might be streaming the latest snapshot.<br>Check him out <a href="https://www.twitch.tv/phoenixsclive">here</a>.`;
        }
    }

    var snapshot_live_event = async (snapshot_name) => {
        play_audio();
        send_notification("Snapshot Live!", `The snapshot ${snapshot_name} is live!`);
    }

    var play_audio = async () => {
        if(!localStorage.getItem("enable-sound") || localStorage.getItem("enable-sound") != "checked") return;
        new Audio(live_sound).play();
    }

    var send_notification = async (title, body) => {
        if(!localStorage.getItem("enable-notifications") || localStorage.getItem("enable-notifications") != "checked") return;
        if(!("Notification" in window)) return;
        if(Notification.permission === "granted") {
            new Notification(title, {
                body: body,
				badge: "https://is-the-snapshot.live/images/icons/logo.png",
				icon: "https://is-the-snapshot.live/images/icons/logo.png",
				image: "https://is-the-snapshot.live/images/icons/logo.png",
                vibrate: [200, 100, 200],
            });
        }
    }

    var check = async (data, snapshot_override = null) => {
        for(var _ of data.versions) {
            if(_.id == snapshot_override) {
                var bool = new Date() > new Date(_.releaseTime);
                return bool;
            }
            if(snapshot_override) continue;
            if(_.id == data.latest.snapshot) {
                var release = new Date(_.releaseTime);
                latest_snapshot_released = release;
                var bool = (new Date() > new Date(_.releaseTime)) && (new Date() < new Date(release.getFullYear(), release.getMonth(), release.getDate()+5));
                return bool;
            }
        }
        return false;
    }

    var is_phoenix_live = async () => {
        let a = await fetch(`https://cors.flawcra.cc/?https://www.twitch.tv/phoenixsclive`);
        return (await a.text()).includes('isLiveBroadcast');
    }

})(jQuery);
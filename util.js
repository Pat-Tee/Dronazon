/*
var FRAME_count = 0
    , TIME_delta = 0
    , oldTime = 0
    , fps = 60
    , frames = 0
    , fps_last = 0
*/
    //, MAXFPS = 60
    //, TIMESTEP = 1000 / MAXFPS         
        
        /*
        if (time > fps_last + 1000) {
            fps = 0.25 * frames + (1 - 0.25) * fps
            fps_last = time
            frames = 0
        }
        frames++

        if (time < oldTime + TIMESTEP) {
            requestAnimationFrame(gameLoop)
            return
        }
        TIME_delta += time - oldTime
        oldTime = time;

        FRAME_count = 0;
        while (TIME_delta >= TIMESTEP) {
            updateAll(time)
            TIME_delta -= TIMESTEP
            if (++FRAME_count >= 240) {
                requestAnimationFrame(gameLoop)
                break;
            }
        }
*/      
        //drawList.splice(0, drawList.length)

//        let fpsCount = document.getElementById('timeStep')
//        fpsCount.innerText = "FPS: "+ Math.round(fps)


        // below is working rotation implementation, rotate() takes a radian as input, 9 is a placeholder while i learn about radians XD
        // ctx.translate( player.x+player.width/2, player.y+player.height/2)
        // ctx.rotate( 9 )
        // ctx.translate( -player.x-player.width/2, -player.y-player.height/2 );
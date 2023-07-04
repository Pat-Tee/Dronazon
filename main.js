import touchHandler from './touchInput.js'
// Loading text in place, hide when page is loaded
window.addEventListener('load', ()=>{
    const loadtext = document.getElementById('loading')
    loadtext.style.display = 'none'
})
// global definitions. I plan to reduced globals and limit scope
const canvas = document.getElementById('canvas-main') //canvas drawing area
    , ctx = canvas.getContext('2d') //canvas context ie 'paintbrush'
    , CANVAS_WIDTH = canvas.width = window.innerWidth - window.innerWidth * 0.25
    , CANVAS_HEIGHT = canvas.height = window.innerHeight - window.innerHeight * 0.25
    , gradient = ctx.createLinearGradient(0,0,0,CANVAS_HEIGHT)
    , DRONE_WIDTH = 8
    , DRONE_HEIGHT = 16
    , GRAVITY = 0.2
    , DRAG = 0.99
    , XUNIT = 0.1
    , YUNIT = 0.1
    , MIN_PACKAGES = 10
    , MAX_PACKAGES = 20
    , MAX_DRONESPEED = 2
    , MAX_VELOCITY = 8 // terminal velocity
    , COLOR_PLAYER = '#00FF00'
    , COLOR_COMP = 'red'
    , HANDICAP = 0.4
    , HANDICAP_Y = 0.25
    , HANDICAP_X = 0.25
    , DEBUG = document.getElementById('debug')
    , RANDOM =(max)=>{ // convenience function
        return Math.floor(Math.random() * max)
    }
    // basic collision check function
    , collision=(rect1, rect2)=>{
        if (rect1.x > rect2.x+rect2.width || rect2.x > rect1.x+rect1.width) return false
        if (rect1.y > rect2.y+rect2.height || rect2.y > rect1.y+rect1.height) return false
        return true
    }
const GROUND = { // rectangle to represent the ground for collision
        x: 0
        ,y: CANVAS_HEIGHT
        ,width: CANVAS_WIDTH
        ,height: 0
    }
// variable to track window focus
var FOCUS = true
    , PAUSE = true

// set paramaters to make a 'beautiful' background
// these settings make it somewhat resemble our Terran horizon
gradient.addColorStop(0, "white")
gradient.addColorStop(0.15, "lightblue")
gradient.addColorStop(0.85, 'darkblue')
gradient.addColorStop(1, "black")

window.addEventListener('blur', ()=>{
    if (!FOCUS) FOCUS = false
})
window.addEventListener('focus', ()=>{
    if (FOCUS) FOCUS = true
})

const button=(buttonName, func)=>{
    let ele = document.getElementById(buttonName)

    ele.addEventListener('click', func)
}

const Reload=()=>{
    window.location.reload()
}

const Pause=()=>{
    console.log('Pause called')
    PAUSE = !PAUSE
}

button('reload', Reload)
button('pause', Pause)

const TYPE_drone = () => {
    return {
        id: -1
        , width: DRONE_WIDTH
        , height: DRONE_HEIGHT
        , x: RANDOM(CANVAS_WIDTH)
        , y: RANDOM(CANVAS_HEIGHT)
        , xV : 0
        , yV : 0
        , target: null
        , package: null
        , last_package: null
        , dropping: false
        , score: 0
        , power: 100
    }
}

const droneAction=(drone)=>{
    return {
    moveLeft: ()=>{ if (drone.xV > MAX_DRONESPEED*-1) drone.xV-=XUNIT }
    , moveRight: ()=>{ if (drone.xV < MAX_DRONESPEED) drone.xV+=XUNIT }
    , moveUp: ()=>{ if (drone.yV > MAX_DRONESPEED*-1) drone.yV-=YUNIT}
    , moveDown: ()=>{ if (drone.yV < MAX_DRONESPEED) drone.yV+=YUNIT}
    , moveStop: ()=>{ 
            if (drone.yV < 0) drone.yV += YUNIT
            if (drone.yV > 0) drone.yV -= YUNIT
            if (drone.xV < 0) drone.xV += XUNIT
            if (drone.xV > 0) drone.xV -= XUNIT

            if (Math.abs(drone.xV) < 0.5) drone.xV = 0
            if (Math.abs(drone.yV) < 0.5) drone.yV = 0
        }
    , dropPackage: ()=>{ if (drone.package) { 
                            drone.dropping = true 
                            drone.last_package = drone.package
                            drone.package = null
                            drone.last_package.y += 1
                            } 
                        }
    , reset: ()=>{
            drone.dropping = false
            drone.package = null
            drone.last_package = null
            drone.target = null
            drone.xV = 0
            drone.yV = 0
        }
    }
}

var player = TYPE_drone()
var competition = TYPE_drone()

const inputMap = {
    // this object gets updated every cycle based on eventListener
    // each key bool tracks whether or not the key is currently being pressed
    key: { 
        'a': false
        ,'w': false
        ,'s': false
        ,'d': false
        ,' ': false
        ,'q': false
        ,'Escape': false
    }

    // These members bind functions to each keyname for arbitrary key assignment
    ,'a': droneAction(player).moveLeft
    ,'d': droneAction(player).moveRight
    ,'w': droneAction(player).moveUp
    ,'s': droneAction(player).moveDown
    ,' ': droneAction(player).dropPackage
    ,'q': droneAction(player).moveStop
    ,'r': droneAction(competition).reset
    ,'Escape': Pause
}

//====================INPUT TRACKING

document.addEventListener('keydown', (e)=>{ if (e.key in inputMap) inputMap.key[e.key] = true; console.log('keyDown') }) 
document.addEventListener('keyup', (e)=>{ if (e.key in inputMap) inputMap.key[e.key] = false; console.log('keyUp') }) 

function updateInput() {
    for (const k in inputMap.key) if (inputMap.key[k] === true) { if (k == 'Escape') inputMap.key[k]=false; inputMap[k]() }
}

//TOUCH DEVICE HANDLING
const touchStart=(e)=>{

    if (e.touches) {
        if (PAUSE) PAUSE = !PAUSE
        let dataPanel = document.getElementById('debug')
        //let touchX = e.touches[0].clientX - canvas.offsetLeft // worked on iPhone, not on android
        //let touchY = e.touches[0].clientY - canvas.offsetTop //
        let touchX = e.touches[0].pageX - canvas.offsetLeft
        let touchY = e.touches[0].pageY - canvas.offsetTop
        console.log(e.touches[0])

        if (e.touches[1])
            droneAction(player).dropPackage()

        if (touchX < player.x) droneAction(player).moveLeft()
        if (touchX > player.x) droneAction(player).moveRight()
        if (touchY < player.y) droneAction(player).moveUp()
        if (touchY > player.y) droneAction(player).moveDown()

        e.preventDefault()
    }
}

touchHandler(touchStart)

// game object templates, anonymous functions that each returns a new object of that type 
const TYPE_building = () => {
    return {
        id: -1
        , width: 80
        , height: 80
        , x: 0
        , y: 0
//    , isTarget: false
    }
}

const TYPE_package = ()=>{
    return {
        id: -1
        , width: 8
        , height: 8
        , x: 0
        , y: 0
        , xV: 0
        , yV: 0
        , target: null
        , delivered: false
    }
}

const TYPE_dropZone = (color)=>{
    return {
        id: -1
        , x: 0
        , y: 0
        , width: 80
        , height: 4
        , color: color
    }
}

const playerDZ = TYPE_dropZone(COLOR_PLAYER)
const compDZ = TYPE_dropZone(COLOR_COMP)
const dropZones = [playerDZ, compDZ]

var buildings = []
var packages = []

{ // scoped block for local variables to initialize game world
    // partitionSize is the range we want to generate a building in. the larger this is the less buildings we will have
    let partitionSize = TYPE_building().width
    , partitions = Math.floor( (CANVAS_WIDTH) / partitionSize ) // how many partitions will fit in canvas
    , minX = 0 - partitionSize * 0.5 // allow half the building to exist outside the canvas
    , maxX = partitionSize // redundant- for clarity

    for (let i = 0; i<partitions; i++ ) {
        console.log(`minX: ${minX} maxX: ${maxX} incX: ${partitionSize}`)
        buildings.push( TYPE_building() )
        buildings[i].x = RANDOM(maxX-minX) +minX
        buildings[i].y = RANDOM(CANVAS_HEIGHT-CANVAS_HEIGHT/5) + CANVAS_HEIGHT/5-30 
        // remember: y coords are upside down. canvas-height /5 makes the potential top of buildings 80% of canvas height
        // the minus 30 make minimum from bottom of screen so no buildings shorter than that
        // buildings are always drawn to bottom of canvas ('top' of height)

        minX = buildings[i].x + partitionSize
        maxX = minX+partitionSize 
        if (minX>=CANVAS_WIDTH - TYPE_building().width) break;
        // stop creating buildings if no more will fit
    }
    console.log(`canvas_width: ${CANVAS_WIDTH} canvas_height: ${CANVAS_HEIGHT}`)
    console.log(`number of buildings: ${buildings.length}`)
    console.log(`partitionsize: ${partitionSize} partitions: ${partitions}`)
    console.log(`building 0 x :${buildings[0].x}`)
}

{ // create all packages
    let numPackages = Math.random() * (MAX_PACKAGES-MIN_PACKAGES) + MIN_PACKAGES
    for (let i=0; i < numPackages; i++) {
        packages.push( TYPE_package() )
        packages[i].x = RANDOM(CANVAS_WIDTH - packages[i].width)
        packages[i].target = RANDOM(buildings.length-1)
        packages[i].xV = 0
        packages[i].yV = 0
    }
}
console.log(`Number of packages: ${packages.length}`)
// Draw function definitions for objects
function drawBackground(){
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,CANVAS_WIDTH, CANVAS_HEIGHT)
}

function drawPlayer(){
    ctx.fillStyle = '#00FF00'
    ctx.fillRect(player.x
        , player.y
        , player.width
        , player.height)
    ctx.strokeStyle = 'black'
    ctx.strokeRect(player.x
        , player.y
        , player.width
        , player.height)
}

function drawCompetition(){
    ctx.fillStyle = '#FF0000'
    ctx.fillRect(competition.x
        , competition.y
        , competition.width
        , competition.height)
    ctx.strokeStyle = 'black'
    ctx.strokeRect(competition.x
        , competition.y
        , competition.width
        , competition.height)
}

function drawBuildings() {
    for (let i = 0; i<buildings.length; i++) {
        ctx.fillStyle = '#333333'
        ctx.fillRect(
            buildings[i].x
            , buildings[i].y
            , buildings[i].width
            , CANVAS_HEIGHT)

        ctx.strokeStyle = 'black'
        ctx.strokeRect(
            buildings[i].x
            , buildings[i].y
            , buildings[i].width
            , CANVAS_HEIGHT)
    }
}

function drawZones() {
    for (let i=dropZones.length-1; i >= 0; i-- ) {
        if ( dropZones[i].y>0 ) {
            ctx.fillStyle=dropZones[i].color
            ctx.fillRect(
                dropZones[i].x
                , dropZones[i].y
                , dropZones[i].width
                , dropZones[i].height
            )
        }
    }
}

function drawPackages() {
    for (let i=0; i<packages.length; i++) {
        ctx.fillStyle = '#966432' //'#FFAAAA'
        ctx.fillRect(
            packages[i].x
            ,packages[i].y
            ,packages[i].width
            ,packages[i].height )

        ctx.strokeStyle = 'black'
        ctx.strokeRect(
            packages[i].x
            , packages[i].y
            , packages[i].width
            , packages[i].height
        )
    }
}

//===============================================================MAIN OBJECT UPDATING FUNCTION
function updateAll() {
    let removePackage = -1

    player.x += player.xV
    player.y += player.yV

    competition.x += competition.xV
    competition.y += competition.yV

    for (let i=0; i < packages.length; i++) {
        let p = packages[i]
        
        if (p.delivered)
            removePackage = i;

        if (p.x < 0) {p.x = 0; p.xV = 0}
        if (p.x+p.width > CANVAS_WIDTH) {p.x = CANVAS_WIDTH-p.width; p.xV = 0}
            
        p.y += p.yV
        p.x += p.xV

        p.xV *= DRAG

        if (p.yV < MAX_VELOCITY)
            p.yV += GRAVITY
        
        if (collision(p, GROUND)) {
            p.y = GROUND.y - p.height;
            p.yV *= -0.4;
            if (p.yV > -1.4 && p.yV < 1.4) 
                p.yV = 0;
            p.xV *= 0.4
        }

        if (!player.package ) {
            if (collision(player, p)) {
                player.y = p.y-player.height
                player.yV = 0
                player.package = p
                dropZones[0].x = buildings[p.target].x 
                dropZones[0].y = buildings[p.target].y 
            }
        }

        if (!competition.package ) {
            if (collision(competition, p)) {
                competition.y = p.y-competition.height
                competition.yV = 0
                competition.package = p
                competition.target = buildings[p.target]
                dropZones[1].x = buildings[p.target].x 
                dropZones[1].y = buildings[p.target].y 
            }
        } 
    }

    if (removePackage > -1) {
        packages.splice(removePackage,1)
        removePackage = -1
    }

//============ PLAYER LOGIC AND BOUNDARIES
    if (player.package) {
        if (!player.package.delivered) {
            player.package.xV = player.xV
            player.package.yV = player.yV
            player.package.x = player.x
            player.package.y = player.y+player.height
            if ( collision(player.package, GROUND)) {
                //player.xV *= 0.2
            }
            if (collision(player, player.package))
                player.y = player.package.y-player.height
        } else { player.package = null; player.last_package = null }
    }

    if (player.dropping) {
        let box = player.last_package
        let zone = dropZones[0]

        if ( collision(box, zone) ) {
            player.score++
            zone.y = 0;
            player.dropping = false
            box.delivered = true
            player.last_package = null
        }

        if ( collision(box, GROUND) && player.package !== box) {
            zone.y = 0
            player.dropping = false
            player.last_package = null
        }

        if (box.y > GROUND.y)
            box.y = GROUND.y - box.height

        if (box.x <= 0 || box.x >= CANVAS_WIDTH) box.xV *= -1
    }
//==============COMPETITION LOGIC AND BOUNDARIES
    if (!competition.target || competition.target.delivered) {
        competition.target = packages[RANDOM(packages.length-1)]
    }

    if (competition.target) {
        if ( ((competition.x + competition.width) / 2) < ((competition.target.x + competition.target.width) / 2)
            && competition.xV < MAX_DRONESPEED - HANDICAP) 
                droneAction(competition).moveRight()
        else { if (competition.xV > MAX_DRONESPEED*-1 + HANDICAP)
                droneAction(competition).moveLeft() }

        if (competition.y+competition.height+competition.target.height/2 < competition.target.y
            && competition.yV < MAX_DRONESPEED - HANDICAP) 
            droneAction(competition).moveDown()
        else { if (competition.yV > MAX_DRONESPEED*-1 + HANDICAP)
                droneAction(competition).moveUp() }

        if (competition.package 
            && (competition.x) >= buildings[competition.package.target].x 
            && competition.x <= buildings[competition.package.target].x + buildings[competition.package.target].width
            && (competition.y + competition.height + competition.package.height) < buildings[competition.package.target].y
            ){ 
            droneAction(competition).dropPackage()
            console.log('competition dropping package')
                competition.target = null
            }
    }  

    if (competition.package) {
        if (!competition.package.delivered) {
            competition.package.xV = competition.xV
            competition.package.yV = competition.yV
            competition.package.x = competition.x
            competition.package.y = competition.y+competition.height
            if ( collision(competition.package, GROUND)) {
                competition.xV *= 0.2
            }
            if (collision(competition, competition.package))
                competition.y = competition.package.y-competition.height
        } else { competition.package = null; competition.target = null; competition.last_package = null }
    }

    if (competition.dropping) {
        let box = competition.last_package
        let zone = {
            x: buildings[box.target].x
            ,y: buildings[box.target].y
            ,width: compDZ.width
            ,height: compDZ.height
        }

        if ( collision(box, zone) ) {
            competition.score++
            zone.y = 0
            competition.dropping = false
            competition.target = null
            box.delivered = true
            competition.last_package = null
        }

        if ( collision(box, GROUND) && competition.package !== box) {
            zone.y = 0
            competition.dropping = false
            competition.target = null
            competition.last_package = null
        }

        if (box.y > GROUND.y)
            box.y = GROUND.y - box.height

        if (box.x <= 0 || box.x >= CANVAS_WIDTH) box.xV *= -1
    }
//=========END COMP LOGIC AND BOUNDARIES
// Canvas Boundary collision
    if (player.x < 0) { player.x = 0; player.xV = 0 }
    if (player.y < 0) { player.y = 0; player.yV = 0 }
    if (player.x+player.width >= CANVAS_WIDTH) { player.x = CANVAS_WIDTH - player.width; player.xV = 0 }
    if (collision (player, GROUND) ) { player.y = CANVAS_HEIGHT - player.height; }

    if (competition.x < 0) { competition.x = 0; competition.xV = 0 }
    if (competition.y < 0) { competition.y = 0; competition.yV = 0 }
    if (competition.x+competition.width >= CANVAS_WIDTH) { competition.x = CANVAS_WIDTH - competition.width; competition.xV = 0 }
    if (collision (competition, GROUND) ) { competition.y = CANVAS_HEIGHT - competition.height; if (competition.yV > -1.5 && competition.yV < 1.5) competition.yV = 0 }

}//===================================================================== END OF MAIN UPDATE FUNCTION

function gameLoop(time) { //time is passed in by requestAnimationFrame at the end of the gameLoop
    let scoreBoard = document.getElementById('score')
    scoreBoard.innerText = `Player has delivered ${player.score} ${ (player.score === 1) ? 'box' : 'boxes'}!\n
                        Competition has delivered ${competition.score} ${(competition.score === 1) ? 'box' : 'boxes'}!`

    if (player.score > packages.length+competition.score)
    scoreBoard.innerText = `Player has delivered ${player.score} ${ (player.score === 1) ? 'box' : 'boxes'}! That's the majority!`

    if (competition.score > packages.length+player.score)
    scoreBoard.innerText = `Competition has delivered ${competition.score} ${ (competition.score === 1) ? 'box' : 'boxes'}! That's the majority!`

    updateInput()
    drawAll()

    if (!PAUSE) {
        updateAll()

    } else {
        ctx.font="48px serif"
        ctx.fillStyle = "#FF0000"
        ctx.fillText("PAUSED", 10, 50)
    }
    requestAnimationFrame(gameLoop)
}

function drawAll() {
    ctx.setTransform(1,0,0,1,0,0)
    ctx.globalAlpha = 1
    ctx.clearRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT)
    drawBackground()
    drawBuildings()
    drawZones()
    drawPackages()
    drawCompetition()
    drawPlayer()
}

requestAnimationFrame(gameLoop) // this is the entry call into the game loop
//eL : eventListener handle
// from MDN web documentation:
// touchstart is fired when the user puts a finger on the screen.
// touchmove is fired when they move the finger on the screen while touching it
// touchend is fired when the user stops touching the screen
// touchcancel is fired when a touch is cancelled, for example when the user moves their finger out of the screen.
const eL= document.querySelector("canvas")
export default function touchInput (handleStart, handleMove=null, handleEnd=null, handleCancel=null) {
    eL.addEventListener("touchstart", handleStart)
    eL.addEventListener("touchmove", handleMove || handleStart);
    eL.addEventListener("touchend", handleEnd);
    eL.addEventListener("touchcancel", handleCancel || handleEnd);
}

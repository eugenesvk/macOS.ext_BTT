(async ()=> {
// ResizeAnySide: resizes the corner/border closest to the mouse cursor position so you don't need to hunt for a tiny window border
// use saved 🐁 positon to maintain x/y cursor position when moving to a window's side

const mouseX_rel_to_winActive	= await callBTT('get_number_variable',{variable_name:'percent_x_active_win_btm_left'})
const mouseY_rel_to_winActive	= await callBTT('get_number_variable',{variable_name:'percent_y_active_win_btm_left'})
const mouseX_rel_to_win      	= await callBTT('get_number_variable',{variable_name:'percent_x_hovered_win_btm_left'})
const mouseY_rel_to_win      	= await callBTT('get_number_variable',{variable_name:'percent_y_hovered_win_btm_left'})
const x_rel                  	= mouseX_rel_to_winActive
const y_rel                  	= mouseY_rel_to_winActive
var dbgVar = `mouseX_rel_to_winActive=${mouseX_rel_to_winActive} mouseY_rel_to_winActive=${mouseY_rel_to_winActive} mouseX_rel_to_win=${mouseX_rel_to_win} mouseY_rel_to_win=${mouseY_rel_to_win}`


// Get saved mouse position
const mouse_pos    	= await callBTT('get_string_variable',{variable_name:'saved_mouse_position'})
const mouse_pos_arr	= mouse_pos.replace("{","").replace("}","").split(", ")
if (mouse_pos_arr.length != 2) {
  console.log(`tried to parse get_string_variable, but intsead of 2 numbers got ‘${mouse_pos_arr}’`)
  returnToBTT()
}
const savedMousePos = {
  x: parseFloat(mouse_pos_arr[0]),
  y: parseFloat(mouse_pos_arr[1])
}

// Setup action definitions, to be filled with moveTo positions based on a match later
const actMouseMove = {
  "BTTTriggerType"            	: -1,
  "BTTTriggerClass"           	: "BTTTriggerTypeMagicMouse",
  "BTTPredefinedActionType"   	: 153,
  "BTTPredefinedActionName"   	: "Move Mouse To Position",
  // "BTTGenericActionConfig" 	: `{${savedMousePos.x}, ${savedMousePos.y}`, // STUBS!
  // "BTTMoveMouseToPosition" 	: `{${savedMousePos.x}, ${savedMousePos.y}`, // STUBS!
  // "BTTMoveMouseRelative"   	: `${winRel}`, // STUBS!
  "BTTAdditionalConfiguration"	: "1048584",
  "BTTEnabled"                	: 1,
  "BTTEnabled2"               	: 1,
  "BTTRequiredModifierKeys"   	: 1048576,
  "BTTOrder"                  	: 2
}
const actClickDown = {
  "BTTTriggerType"            	: -1,
  "BTTTriggerClass"           	: "BTTTriggerTypeMagicMouse",
  "BTTPredefinedActionType"   	: 119,
  "BTTPredefinedActionName"   	: "Custom Mouse Buttons & Modifiers(⌃⌥⇧⌘)",
  "BTTGenericActionConfig"    	: "1000",
  "BTTGenericActionConfig2"   	: "1",
  "BTTCustomClickConfig"      	: "1000",
  "BTTCustomClickUpDownConfig"	: "1",
  "BTTEnabled"                	: 1,
  "BTTEnabled2"               	: 1,
  "BTTOrder"                  	: 3
  }
const actWinMove =      {
  "BTTTriggerType"         	: -1,
  "BTTTriggerClass"        	: "BTTTriggerTypeMagicMouse",
  "BTTPredefinedActionType"	: 69,
  "BTTPredefinedActionName"	: "Start Moving",
  "BTTGenericActionConfig" 	: "1000",
  "BTTGenericActionConfig2"	: "1",
  "BTTUUID"                	: "A0BF92DC-0AE1-4F64-9252-24240F8779BC",
  "BTTEnabled"             	: 1,
  "BTTEnabled2"            	: 1,
  "BTTOrder"               	: 1
  }

// Define screen rectangles areas and the corresponding position/anchor mouse should move to on match. Null=use saved mouse position
const win_areas	= new Map(Object.entries({ // lower-left and upper-right
  '↖️':new Map(Object.entries({lowL:[  0, 66],upR:[ 33,100], moveTo:{x:   0,y:   1}, anchor:1})), //BTTMoveMouseRelative top left
  '⬆️':new Map(Object.entries({lowL:[ 33, 66],upR:[ 66,100], moveTo:{x:null,y:   1}, anchor:1})), // top    left
  '↗️':new Map(Object.entries({lowL:[ 66, 66],upR:[100,100], moveTo:{x:   0,y:   1}, anchor:2})), // top    right
  '⬅️':new Map(Object.entries({lowL:[  0, 33],upR:[ 33, 66], moveTo:{x:   0,y:null}, anchor:1})), // top    left
  '➡️':new Map(Object.entries({lowL:[ 66, 33],upR:[100, 66], moveTo:{x:   0,y:null}, anchor:2})), // top    right
  '↙️':new Map(Object.entries({lowL:[  0,  0],upR:[ 33, 33], moveTo:{x:   0,y:   0}, anchor:3})), // bottom left
  '⬇️':new Map(Object.entries({lowL:[ 33,  0],upR:[ 66, 33], moveTo:{x:null,y:   0}, anchor:3})), // bottom left
  '↘️':new Map(Object.entries({lowL:[ 66,  0],upR:[100, 33], moveTo:{x:   0,y:   0}, anchor:4})), // bottom right
  '•' :new Map(Object.entries({lowL:[ 33, 33],upR:[ 66, 66], moveTo:{x:   0,y:   0}, anchor:5})), // center
}));

isMouseMove	= false
isResize   	= false
isMove     	= false
win_areas.forEach((v, k) => {
  if (!v.has('lowL')) {return}
  if (!v.has('upR' )) {return}
  const lowL_x	= v.get('lowL')[0]
  const lowL_y	= v.get('lowL')[1]
  const uppR_x	= v.get('upR')[0]
  const uppR_y	= v.get('upR')[1]
  // p(`${lowL_x} ${lowL_y} ${uppR_x} ${uppR_y}`)
  if ((x_rel>=lowL_x) && (y_rel>=lowL_y)
   && (x_rel< uppR_x) && (y_rel< uppR_y) ){
    isMouseMove	= true
    dbgVar += `matched key = ${k}`
    const winRel	= v.get('anchor')
    const moveTo	= v.get('moveTo')
    const moveTo_x= (moveTo.x===null)? savedMousePos.x : moveTo.x // use saved mouse position on null
    const moveTo_y= (moveTo.y===null)? savedMousePos.y : moveTo.y
    actMouseMove.BTTGenericActionConfig	= `{${moveTo_x}, ${moveTo_y}}`
    actMouseMove.BTTMoveMouseToPosition	= `{${moveTo_x}, ${moveTo_y}}`
    actMouseMove.BTTMoveMouseRelative  	= `${winRel}`
    if (k === '•') {isMove=true} else {isResize=true}
  } else {
    returnToBTT(dbgVar);}
});
// console.log(`get_string_variable parsing result: ‘${mouse_pos_arr}’`)
// const result = await callBTT("set_string_variable",{variable_name:savedVarName,to:jsMousePos.x})
// console.log(`${dbgVar}`)

if        (isMouseMove){
  const result1 = await callBTT('trigger_action',{json:JSON.stringify(actMouseMove),wait_for_reply:true }) }
if        (isResize){
  const result2 = await callBTT('trigger_action',{json:JSON.stringify(actClickDown),wait_for_reply:false})
} else if (isMove){
  const result2 = await callBTT('trigger_action',{json:JSON.stringify(actWinMove  ),wait_for_reply:false})
}
result = dbgVar
returnToBTT(result);

})()

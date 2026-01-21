local start = false
function onEndSong()
    if start ~= 'sex' then start = isStoryMode end
    if start == true then
        runTimer('start',0.01)
        return Function_Stop
    elseif start == 'sex' then
        return Function_Continue
    end
end
function anim(tag,name,xml,fps,loop,ofx,ofy,indices)
    if indices == nil then addAnimationByPrefix(tag,name,xml,fps,loop)
    else addAnimationByIndices(tag,name,xml,indices,fps,loop) end
    addOffset(tag,name,ofx,ofy)
    playAnim(tag,name,true)
end
function onCreatePost()
	if isStoryMode then
        cam = {bf = {x = getCam('boyfriend','x'),y = getCam('boyfriend','y')},gf = {x = getCam('gf','x'),y = getCam('gf','y')},dad = {x = getCam('dad','x'),y = getCam('dad','y')},}
        makeAnimatedLuaSprite('cutdad','characters/cutscenes/worship/sarventeWorship',getProperty('dad.x')+300,getProperty('dad.y')+190)
        addLuaSprite('cutdad') scaleObject('cutdad',2,2)
        setObjectOrder('cutdad',getObjectOrder('boyfriendGroup')+1)
        setProperty('cutdad.visible',false)
        anim('cutdad','calling','sarvente calling',24,false,-98,-338)
        anim('cutdad','calling-loop','sarvente calling',24,true,-98,-338,'11,12,13,14')
        anim('cutdad','falling','sarvente falling',24,false,-93,-83)
    end
end
function onUpdatePost() if getProperty('cutdad.animation.curAnim.name') == 'calling' and getProperty('cutdad.animation.curAnim.finished') then playAnim('cutdad','calling-loop') end end
function tweenCam(x,y,dur,ease)
    data = {x,y,dur,ease}
    if x == nil then data[1] = '' end
    if y == nil then data[2] = '' end
    if dur == nil or dur <= 0 then data[3] = '0.0001' end
    if ease == nil then data[4] = 'quadInOut' end
    triggerEvent('Tween Cam Pos',(data[1]..','..data[2]),(data[3]..','..data[4]))
end
function camZoom(zoom,dur,ease) doTweenZoom('camGame','camGame',zoom,dur,ease or 'quadInOut') end
function onTimerCompleted(t)
    if t == 'start' then
        tweenCam(cam.dad.x+75,cam.dad.y+75,0)
        setProperty('cameraSpeed',9999)
        playAnim('dad','idle',true)
        makeLuaSprite('negro',nil,0,0)
        makeGraphic('negro',4000,4000,'000000')
        addLuaSprite('negro')
        setObjectCamera('negro','camOther')
        setProperty('negro.alpha',0.00001)
        playSound('worshipCutsceneStart')
        runTimer('cut0',1.49)
    elseif t == 'cut0' then
        playAnim('dad','tired')
        setProperty('dad.specialAnim',true)
        camZoom(0.75,0.5,'quartOut')
        playSound('heartbeat',1,'heartbeatSfx',true)
        runTimer('cut1',1.9)
    elseif t == 'cut1' then
        camZoom(1,0.5,'quartOut')
        playAnim('cutdad','falling')
        setProperty('dad.visible',false)
        setProperty('cutdad.visible',true)
        runTimer('cut2',0.4)
    elseif t == 'cut2' then
        playSound('bullet')
        stopSound('heartbeatSfx')
        cameraShake('camGame',0.01,1)
        runTimer('cut3',1.2)
    elseif t == 'cut3' then
        camZoom(0.8,3)
        playAnim('cutdad','calling')
        playSound('dialing')
        runTimer('cut4',3)
    elseif t == 'cut4' then
        tweenCam(cam.dad.x+75,cam.dad.y-575,3,'quadOut')
        playAnim('cutdad','calling-loop')
        playSound('phoneRinging',1,'phoneRinging',true)
        doTweenAlpha('negro','negro',1,2)
        runTimer('cut5',3.9)
        runTimer('endCut',5.5)
    elseif t == 'cut5' then stopSound('phoneRinging')
    elseif t == 'endCut' then start = 'sex' endSong() end return Function_Continue
end
function onTweenCompleted(t) if t == 'menacingjojo' then removeLuaSprite('jojosimbolo') end end
function getCam(c,ty)
    pos = ty == 'x' and getMidpointX(c) or getMidpointY(c)
    ofC = (getProperty(c..'.cameraPosition['..(ty == 'x' and 0 or 1)..']')*(ty == 'x' and (c == 'boyfriend' and -1 or 1) or 1))
    of = getProperty((c == 'dad' and 'opponent' or c == 'gf' and 'girlfriend' or 'boyfriend')..'CameraOffset['..(ty == 'x' and 0 or 1)..']')
    return pos+ofC+of+(ty == 'x' and (c == 'boyfriend' and -100 or c == 'gf' and 0 or 150) or (c == 'gf' and 0 or -100))
end
start = false
function onStartCountdown()
	if isStoryMode and not seenCutscene then
        if start == false then
            setProperty('camHUD.visible',false)
            runTimer('start',0.01)
            return Function_Stop
        else return Function_Continue end
    end
end
function anim(tag,name,xml,fps,loop,ofx,ofy,indices)
    if indices == nil then addAnimationByPrefix(tag,name,xml,fps,loop)
    else addAnimationByIndices(tag,name,xml,indices,fps,loop) end
    addOffset(tag,name,ofx,ofy)
    playAnim(tag,name,true)
end
function onCreatePost()
	if isStoryMode and not seenCutscene then
        cam = {bf = {x = getCam('boyfriend','x'),y = getCam('boyfriend','y')},gf = {x = getCam('gf','x'),y = getCam('gf','y')},dad = {x = getCam('dad','x'),y = getCam('dad','y')}}
        setProperty('cameraSpeed',9999)
        tweenCam(cam.dad.x,cam.dad.y-1000)
        setProperty('camGame.zoom',1)
        makeAnimatedLuaSprite('jojosimbolo','cutscenes/menacingParticles',getProperty('dad.x')-200,getProperty('dad.y')-190)
        anim('jojosimbolo','idle','menacing sprit',24,false,0,0)
        addLuaSprite('jojosimbolo')
        makeAnimatedLuaSprite('cutdad','characters/cutscenes/zavodilla/ruvZavodilla',getProperty('dad.x'),getProperty('dad.y')-3860-190) scaleObject('cutdad',2,2)
        addLuaSprite('cutdad')
        setObjectOrder('cutdad',getObjectOrder('dadGroup'))
        setObjectOrder('jojosimbolo',getObjectOrder('cutdad')+1)
        setProperty('dad.visible',false)
        setProperty('jojosimbolo.visible',false)
        anim('cutdad','landing','ruv landing',24,false,-20,-60)
        anim('cutdad','jojopose','ruv pose',24,false,146,16)
        anim('cutdad','jojopose-loop','ruv pose',24,true,146,16,'9,10,11,12')
        anim('cutdad','falling','ruv falling',24,true,-115,256)
    end
end
function opponentNoteHit()
    if luaSpriteExists('cutdad') then removeLuaSprite('cutdad') setProperty('dad.visible',true) close() end
end
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
        doTweenY('cutdad','cutdad',getProperty('dad.y')+70,0.5,'quadIn')
        playSound('zavodillaCutsceneAudio')
        runTimer('cut0',0.01)
    elseif t == 'cut0' then
        tweenCam(cam.dad.x,cam.dad.y,1,'quadOut')
        camZoom(0.4,1,'quartOut')
        runTimer('cut1',0.48)
    elseif t == 'cut1' then
        playAnim('cutdad','landing')
        runTimer('cut2',0.5)
    elseif t == 'cut2' then
        playAnim('cutdad','jojopose')
        camZoom(0.8,0.7,'quintInOut')
        runTimer('cut3',0.3)
    elseif t == 'cut3' then
        setProperty('jojosimbolo.visible',true)
        playAnim('jojosimbolo','idle',true)
        tweenCam(cam.dad.x,cam.dad.y,0)
        runTimer('cut4',0.7)
    elseif t == 'cut4' then
        playAnim('cutdad','jojopose-loop')
        doTweenAlpha('menacingjojo','jojosimbolo',0,5,'quadOut')
        runTimer('endCut',1)
    elseif t == 'endCut' then
        removeLuaSprite('nulmove')
        setProperty('cameraSpeed',1)
        setProperty('camHUD.visible',true)
        start = true
        startCountdown()
    end
end
function onTweenCompleted(t) if t == 'menacingjojo' then removeLuaSprite('jojosimbolo') end end
function getCam(c,ty)
    pos = ty == 'x' and getMidpointX(c) or getMidpointY(c)
    ofC = (getProperty(c..'.cameraPosition['..(ty == 'x' and 0 or 1)..']')*(ty == 'x' and (c == 'boyfriend' and -1 or 1) or 1))
    of = 0
    return pos+ofC+of+(ty == 'x' and (c == 'boyfriend' and -100 or c == 'gf' and 0 or 150) or (c == 'gf' and 0 or -100))
end
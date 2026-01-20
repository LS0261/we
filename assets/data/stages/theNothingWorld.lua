function bg(t,f,x,y,sc,s,fo,a) sprite(t,'stages/void/'..f,x,y,sc,s,fo,a) end
function onCreate()
    bg('voidGradient','voidGradient',-1450,-1000,0.5)
    bg('seleverPentagram','seleverPentagram',-660,-600,1,0.8,false,true)
    setProperty('seleverPentagram.alpha',0.0001)
    setObjectOrder('seleverPentagram',getObjectOrder('dadGroup')-1)
    bg('seleverSign','seleverSign',-1020,-315,1,1,true)
    bg('seleverSignFragments','seleverSignFragments',-940,150,1,1)
    addAnimationByPrefix('seleverSignFragments','idle','demon pentagram',24,true)
    playAnim('seleverSignFragments','idle',true)
end
function onCreatePost() setProperty('camGame.bgColor',getColorFromHex('FFFFFF')) end
function onDestroy() setProperty('camGame.bgColor',getColorFromHex('000000')) end
function sprite(t,f,x,y,sc,s,fo,a) --tag, file, x, y, scale, foreground, animated
    if a == true then makeAnimatedLuaSprite(t,f,x,y)
    else makeLuaSprite(t,f,x,y) end
    scaleObject(t,s == nil and 2.5 or (s*2.5),s == nil and 2.5 or (s*2.5))
    addLuaSprite(t,fo) --credits to Speg
    if sc ~= nil then setScrollFactor(t,sc,sc) end
end
function onCountdownTick(c)
    if songName:lower():find('casanova') then
        if c == 3 then
            doTweenAngle('seleverPentagram','seleverPentagram',360,2)
            setProperty('seleverPentagram.alpha',1)
            playAnim('dad','EYP',true)
            setProperty('dad.specialAnim',true)
            doTweenZoom('camGame','camGame',1.3,0.5,'quadOut')
        end
    end
end
function onSongStart()
    if songName:lower():find('casanova') then doTweenAlpha('bye','seleverPentagram',0,0.2) end
end
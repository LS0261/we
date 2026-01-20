function bg(t,f,x,y,sc,s,fo,a) sprite(t,'stages/church/death/erect/'..f,x,y,sc,s,fo,a) end
function anim(t,n,xml,fps,loop)
    addAnimationByPrefix(t,n,xml,fps,loop)
    playAnim(t,n,true)
end
function onCreate()
    sprite('darkMountain','stages/church/death/darkMountain',-2300,-600,0.7,0.8)
    setProperty('darkMountain.alpha',0.5)
    bg('superCoolPentagram','superCoolPentagram',-250,-900,0.9,1,false,true)
    anim('superCoolPentagram','idle','demon pentagram instance 1',24,true)
    bg('crateredWall','crateredWall',-2300,-1550,0.98)
    bg('eyeBlinking','eyeBlinking',-990,-720,0.98,1,false,true)
    anim('eyeBlinking','idle','eyeBall instance 1',24,true)
    bg('demonGrounds','demonGrounds',-2300,170,1,1,false,true)
    anim('demonGrounds','idle','ground cuved instance 1',24,true)
    bg('backCandles','backCandles',50,200,0.97,0.8)
    bg('gospelFire','gospelFire',-50,-800,0.99,0.8,false,true)
    anim('gospelFire','idle','pinkfire instance 1',24,true)
    bg('frontCandles','frontCandles',0,200,1,0.8,true)
    bg('rightPillar','rightPillar',1000,-400,1,1,true)
    bg('leftPillar','leftPillar',-1600,300,1,1,true)
    bg('chiseledThingie','chiseledThingie',-2100,-2000,1.1,1.1,true)
    bg('theGradient','evilAssPurpleGradient',-3000,-2000,1.2,1.5,true)
    doTweenAngle('penta','superCoolPentagram',360,0.5)
end
function onTweenCompleted(t) if t == 'penta' then setProperty('superCoolPentagram.angle',0) doTweenAngle('penta','superCoolPentagram',360,0.5) end end
function sprite(t,f,x,y,sc,s,fo,a) --tag, file, x, y, scale, foreground, animated
    if a == true then makeAnimatedLuaSprite(t,f,x,y)
    else makeLuaSprite(t,f,x,y) end
    scaleObject(t,s == nil and 2.5 or (s*2.5),s == nil and 2.5 or (s*2.5))
    addLuaSprite(t,fo) --credits to Speg
    if sc ~= nil then setScrollFactor(t,sc,sc) end
end
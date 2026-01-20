function bg(t,f,x,y,sc,s,fo,a) sprite(t,'stages/church/erect/parish/'..f,x,y,sc,s,fo,a) end
function anim(t,n,xml,fps,loop)
    addAnimationByPrefix(t,n,xml,fps,loop)
    playAnim(t,n,true)
end
function onCreate()
    bg('churchWallGroup','churchWallGroup',-1925,-1900,0.95)
    bg('churchFloor','churchFloor',-2050,-400)
    bg('pinkCross','pinkCross',-165,-1050,0.97)
    bg('fernBox','fernBox',-415,-800,0.97,1,false,true)
    anim('fernBox','idle','cross holder instance 1',24,true)
    bg('ceilingLampC','ceilingLamp',600,-1600,0.9,0.6,true)
    bg('ceilingLamp2C','ceilingLamp',-700,-1600,0.9,0.6,true)
    bg('lampLightC','lampGlow',-800,-1000,0.9,0.6,true)
    bg('lampLight2C','lampGlow',500,-1000,0.9,0.6,true)
    for i = 1,2 do bg('churchPillar'..i,'churchPillar',i == 1 and 575 or -1075,-1900,1.05,1,true) end
    for i = 1,2 do bg('churchBenches'..i,'churchBenches',i == 1 and 655 or -2705,100,1.1,0.86,true) end setProperty('churchBenches2.flipX',true)
    bg('ceilingLampB','ceilingLamp',900,-1800,1.1,0.8,true)
    bg('ceilingLamp2B','ceilingLamp',-1400,-1800,1.1,0.8,true)
    bg('lampLightB','lampGlow',800,-1000,1.1,0.8,true)
    bg('lampLight2B','lampGlow',-1550,-1000,1.1,0.8,true)
    bg('ceilingLampA','ceilingLamp',1200,-1700,1.2,1,true)
    bg('ceilingLamp2A','ceilingLamp',-1900,-1700,1.2,1,true)
    bg('lampLightA','lampGlow',1050,-800,1.2,1,true)
    bg('lampLightA','lampGlow',-2050,-800,1.2,1,true)
    bg('gradient','parishGradient',-2800,-1700,1.2,1,true)
end
function sprite(t,f,x,y,sc,s,fo,a) --tag, file, x, y, scale, foreground, animated
    if a == true then makeAnimatedLuaSprite(t,f,x,y)
    else makeLuaSprite(t,f,x,y) end
    scaleObject(t,s == nil and 2.5 or (s*2.5),s == nil and 2.5 or (s*2.5))
    addLuaSprite(t,fo) --credits to Speg
    if sc ~= nil then setScrollFactor(t,sc,sc) end
end
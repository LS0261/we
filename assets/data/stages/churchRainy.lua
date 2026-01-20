function onCreate()
    bg('rainySky','rainySky',-2700,-1800,0.4)
    for i = 1,2 do bg('clouds'..i,'clouds'..i,-2700,-1800,0.4) setProperty('clouds'..i..'.alpha',0.5) end for i = 1,2 do bg('backgroundFoliage'..i,'backgroundFoliage',i == 1 and -1450 or 500,-300,0.82) end
    bg('cathedralInterior','cathedralInterior',-510,-340,0.84,0.9)
    bg('churchCathedral','churchCathedral',-600,-1825,0.9,0.9)
    bg('foliageLeftALT','foliageLeft', 250,-380,0.94,1,false,true)
    anim('foliageLeftALT','idle','mini bush',24,true)
    bg('foliageLeft','foliageLeft', -1700,-380,0.94,1,false,true)
    anim('foliageLeft','idle','mini bush',24,true)
    bg('pathofPearl','pathofPearl',-2740,-180)
    bg('sakuraTree','sakuraTree',-2000,-1650,0.88,1.1,true,true)
    anim('sakuraTree','idle','sakuraTree rainy instance 1',24,true)
    bg('rightFoliage','rightFoliage', 510,-553,0.88,1.02,true,true)
    anim('rightFoliage','idle','large foliage instance 1',24,true)
    sprite('flyingDove','stages/church/rainy/flyingDove',1500,-1450,1.2,1,true,true)
    anim('flyingDove','landing','dove landing',12,false)
    anim('flyingDove','landing-loop','dove landing loop',24,false)
    anim('flyingDove','flight','dove flying',24,false)
    for i = 1,2 do bg('holyCross'..i,'holyCross',i == 1 and 700 or -1200,-650,1,1,true) end setProperty('holyCross2.flipX',true)
    bg('rainyGradient','rainyGradient',-2800,-1700,1,2.2,true)
    setProperty('rainyGradient.flipX',true)
end
function bg(t,f,x,y,sc,s,fo,a) sprite(t,'stages/church/rainy/'..f,x,y,sc,s,fo,a) end
function anim(t,n,xml,fps,loop)
    addAnimationByPrefix(t,n,xml,fps,loop)
    playAnim(t,n,true)
end
function sprite(t,f,x,y,sc,s,fo,a) --tag, file, x, y, scale, foreground, animated
    if a == true then makeAnimatedLuaSprite(t,f,x,y)
    else makeLuaSprite(t,f,x,y) end
    scaleObject(t,s == nil and 2 or (s*2),s == nil and 2 or (s*2))
    addLuaSprite(t,fo) --credits to Speg
    if sc ~= nil then setScrollFactor(t,sc,sc) end
end
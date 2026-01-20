function bg(t,f,x,y,sc,s,fo,a) sprite(t,'stages/church/'..f,x,y,sc,s,fo,a) end
function anim(t,n,xml,fps,loop)
    addAnimationByPrefix(t,n,xml,fps,loop)
    playAnim(t,n,true)
end
function onCreate()
    bg('morningSky','morningSky',-2700,-1800,0.4)
    for i = 1,2 do bg('clouds'..i,'clouds'..i,-2700,-1800,0.4) setProperty('clouds'..i..'.alpha',0.5) end
    bg('backgroundFoliage1','backgroundFoliage',-1450,-300,0.82)
    bg('backgroundFoliage2','backgroundFoliage',500,-300,0.82)
    bg('cathedralInterior','cathedralInterior',-510,-340,0.84,0.9)
    bg('churchCathedral','churchCathedral',-600,-1825,0.84,0.9)
    bg('folLeft','foliageLeft',250,-380,0.94,1,false,true) anim('folLeft','idle','mini bush',12,true)
    bg('foliageLeft','foliageLeft', -1700,-380,0.94,1,false,true) anim('foliageLeft','idle','mini bush',12,true)
    bg('pathofPearl','pathofPearl',-2740,-180)
    bg('sakuraTree','sakuraTree',-2000,-1650,0.88,1.1,true,true) anim('sakuraTree','idle','sakuraTree instance 1',12,true)
    bg('rightFoliage','rightFoliage', 510,-553,0.88,1.02,false,true)
    anim('rightFoliage','idle','large foliage instance 1',24,true)
    bg('flyingDove','flyingDove',1500,-1450,1.2,1,true,true)
    anim('flyingDove','landing','dove landing',12,false)
    anim('flyingDove','landing-loop','dove landing loop',24,false)
    anim('flyingDove','flight','dove flying',24,false)
    for i = 1,2 do bg('holyCross'..i,'holyCross',i == 1 and 700 or -1200,-650,1,1,true) end setProperty('holyCross2.flipX',true)
    bg('sunnyGradient','sunnyGradient',-2800,-1700,1,1,true)
    setProperty('sunnyGradient.alpha',0.85)
    setProperty('sunnyGradient.flipX',true)
end
function sprite(t,f,x,y,sc,s,fo,a) --tag, file, x, y, scroll, scale, foreground, animated
    if a == true then makeAnimatedLuaSprite(t,f,x,y)
    else makeLuaSprite(t,f,x,y) end
    addLuaSprite(t,fo)
    scaleObject(t,s == nil and 2.5 or (s*2.5),s == nil and 2.5 or (s*2.5))
    if sc ~= nil then setScrollFactor(t,sc,sc) end
end
local petalsBeat = 4
local petalsOffset = 12
local zDove = 375
local MAX_PETALS = 500
local WIND_INTENSITY = 0.5
local PETAL_SPREAD_MULT = 1.5
function onCreatePost()
    for i = 0,MAX_PETALS do
        bg('petal'..i,'petals/petals',-2000,-500,1,0.4,true,true)
        anim('petal'..i,((i+1)%6)..'0',24,true)
        setObjectOrder('petal'..i,getObjectOrder('sunnyGradient'))
    end
end
local petalsMoving = {}
function onTweenCompleted(t)
    if stringStartsWith(t,'Xpet') then removeLuaSprite(t:gsub('Xpet','')) end
end
function onStepHit()
    index = getRandomInt(0,MAX_PETALS)
    if petalsMoving[index] ~= true then
        if getRandomBool(10) then
			local offsetX = getRandomInt(-600, -400)
			local offsetY = getRandomInt(-650, -150)
            local time = (1.5+getRandomFloat(0.9, 1.4))/WIND_INTENSITY
            doTweenX('Xpetpetal'..index,'petal'..index,(screenWidth*2.4)+offsetX-3000+(4000*WIND_INTENSITY),time,'quadOut')
            doTweenY('Ypetpetal'..index,'petal'..index,(screenHeight/1.3*PETAL_SPREAD_MULT)+offsetY-1500,time,'quadOut')
        end
    end
end
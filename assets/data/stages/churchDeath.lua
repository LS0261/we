function bg(t,f,x,y,sc,s,fo,a) sprite(t,'stages/church/death/'..f,x,y,sc,s,fo,a) end
function anim(t,n,xml,fps,loop)
    addAnimationByPrefix(t,n,xml,fps,loop)
    playAnim(t,n,true)
end
function onCreate()
    bg('sky','sky_black',-2700,-1800,0.4)
    bg('deathMoon','deathMoon',-200,-800,0.45)
    bg('darkMountain','darkMountain',-3450,-960,0.6)
    bg('churchEvil','churchEvil',-800,-1450,0.8)
    bg('leftPath','leftPath',-2900,-100,1,1,false,true)
    anim('leftPath','idle','path left instance 1',24,true)
    bg('rightPath','rightPath',-450,-200,1,1,false,true)
    anim('rightPath','idle','pathway cracked right instance 1',24,true)
    bg('burntTree','burntTree',-2350,-1600,1.05)
    bg('flamingLeft','flamingLeft',-2500,-2100,1.05,1,true,true)
    anim('flamingLeft','idle','fire animation wit fade instance 1',24,true)
    bg('flamingRight','flamingRight',850,-1800,1.05,1,true,true)
    anim('flamingRight','idle','foliage fire instance 1',24,true)
    bg('theGradient','theGradient',-3000,-2450,1,1,true)
end
function onCreatePost() triggerEvent('Set Camera Pos','gf','-200,-1350') end
function sprite(t,f,x,y,sc,s,fo,a) --tag, file, x, y, scale, foreground, animated
    if a == true then makeAnimatedLuaSprite(t,f,x,y)
    else makeLuaSprite(t,f,x,y) end
    scaleObject(t,s == nil and 2.5 or (s*2.5),s == nil and 2.5 or (s*2.5))
    addLuaSprite(t,fo) --credits to Speg
    if sc ~= nil then setScrollFactor(t,sc,sc) end
end
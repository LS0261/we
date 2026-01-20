function onNextDialogue(line)
    if line == 1 or line == 19 then playSound('general/loser')
    elseif line == 9 then doTweenAlpha('negro','negroo',0,2)
    elseif line ==15 or line ==24 then playSound('general/exclaim',0.5)
    elseif line ==22 then playSound('pico/okayOkay')
    elseif line ==25 then playSound('general/disdain',0.8)
    elseif line ==28 then playSound('general/hellYea',0.8)
    end
end
function onCreatePost()
    if not seenCutscene then
        makeLuaSprite('negroo',nil,-2000,-2000)
        makeGraphic('negroo',4000,4000,'000000')
        addLuaSprite('negroo',true)
    end
end
function onSongStart() removeLuaSprite('negroo') close() end
seen = false
function onStartCountdown()
    if not seenCutscene then
        if not seen then
            startDialogue('dialogue','parishSlowed')
            playSound('general/exclaim',0.5)
            seen = true
            return Function_Stop
        end
    end
    return Function_Continue
end
function onNextDialogue(line)
    if line == 13 then playSound('general/revengeanceModeSfx') doTweenAlpha('negroso','negroo',0,2) end
end
function onCreatePost()
    if not seenCutscene then
        makeLuaSprite('negroo',nil,-2000,-2000)
        makeGraphic('negroo',4000,4000,'000000')
        addLuaSprite('negroo',true)
    end
end
seen = false
seenVideo = false
function onSongStart() close() end
function onStartCountdown()
    if not seenCutscene then
        if not seen then
            startDialogue('dialogue','slowedGospelinvalid')
            seen = true
            return Function_Stop
        end
    end
    return Function_Continue
end
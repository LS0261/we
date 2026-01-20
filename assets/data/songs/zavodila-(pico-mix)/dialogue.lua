function onNextDialogue(line)
    if line == 8 then playSound('general/hellYea')
    elseif line == 2 then playSound('pico/yeah')
    elseif line == 7 then playSound('pico/picoBurp') end
end
function onSongStart() close() end
seen = false
function onStartCountdown()
    if not seenCutscene then
        if not seen then
            startDialogue('dialogue','zavodillaSlowed')
            seen = true
            return Function_Stop
        end
    end
    return Function_Continue
end
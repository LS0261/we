function onNextDialogue(line)
    if line == 3 then playSound('general/disdain')
    elseif line == 4 then playSound('pico/yeah') end
end
seen = false
function onSongStart() close() end
function onStartCountdown()
    if not seenCutscene then
        if not seen then
            startDialogue('dialogue','parishSlowed')
            seen = true
            return Function_Stop
        end
    end
    return Function_Continue
end
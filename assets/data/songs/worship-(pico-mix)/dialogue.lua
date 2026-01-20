function onNextDialogue(line)
    if line == 3 then playSound('general/loser',0.6)
    elseif line == 4 then playSound('pico/okayOkay') end
end
seen = false
function onSongStart() close() end
function onStartCountdown()
    if not seenCutscene then
        if not seen then
            startDialogue('dialogue','worshipSlowed')
            playSound('general/exclaim',0.2)
            seen = true
            return Function_Stop
        end
    end
    return Function_Continue
end
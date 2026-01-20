seenVideo = false
function onEndSong()
	if isStoryMode then
		if not seenVideo then
			startVideo('repentedCredits')
			seenVideo = true
			return Function_Stop
		end
	end
	return Function_Continue
end
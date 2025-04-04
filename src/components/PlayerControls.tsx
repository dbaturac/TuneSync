import { colors } from '@/constants/tokens'
import { reCached } from '@/helpers/cache'

import { FontAwesome6 } from '@expo/vector-icons'
import { useDebounceFn } from 'ahooks'
import { memo, useRef } from 'react'
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native'
import RNFS from 'react-native-fs'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import TrackPlayer, { useIsPlaying } from 'react-native-track-player'
type PlayerControlsProps = {
	style?: ViewStyle
}

type PlayerButtonProps = {
	style?: ViewStyle
	iconSize?: number
}

export const PlayerControls = memo(({ style }: PlayerControlsProps) => {
	return (
		<View style={[styles.container, style]}>
			<View style={styles.row}>
				<SkipToPreviousButton />

				<PlayPauseButton />

				<SkipToNextButton />
			</View>
		</View>
	)
})

export const PlayPauseButton = memo(({ style, iconSize = 48 }: PlayerButtonProps) => {
	const { playing } = useIsPlaying()

	return (
		<View
			style={[
				{ height: iconSize, width: iconSize, flexDirection: 'row', justifyContent: 'center' },
				style,
			]}
		>
			<Animated.View>
				<TouchableOpacity
					activeOpacity={0.85}
					onPress={playing ? TrackPlayer.pause : TrackPlayer.play}
				>
					<FontAwesome6 name={playing ? 'pause' : 'play'} size={iconSize} color={colors.text} />
				</TouchableOpacity>
			</Animated.View>
		</View>
	)
})

export const SkipToNextButton = memo(({ iconSize = 30 }) => {
	const scaleAnim = useSharedValue(1)
	const offset = useRef(0)
	const animatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{ scale: scaleAnim.value }],
		}
	})
	const { run } = useDebounceFn(
		async () => {
			const currentIndex = (await TrackPlayer.getActiveTrackIndex()) || 0
			const queue = await TrackPlayer.getQueue()
			const targetIndex = currentIndex + offset.current
			if (targetIndex < 0 || targetIndex > queue.length - 1 || offset.current < 2) {
				await TrackPlayer.skipToNext()
			} else {
				const current = queue[targetIndex]
				const fileExtension = current.basename.split('.').pop() || ''
				const fileName = `${current.basename}.${fileExtension}`
				const filePath = `${RNFS.DocumentDirectoryPath}/music_cache/${fileName}`
				await reCached(current.originalUrl, current.basename, filePath)

				await TrackPlayer.skip(targetIndex)
			}
		},
		{
			wait: 200,
		},
	)

	const handlePressIn = () => {
		offset.current += 1
		scaleAnim.value = withSpring(0.8) // 缩小到90%
	}

	const handlePressOut = () => {
		scaleAnim.value = withSpring(1) // 恢复到原始大小
	}

	return (
		<Animated.View style={animatedStyle}>
			<TouchableOpacity
				activeOpacity={0.85}
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				onPress={run}
				// 这里添加 Skip 的逻辑
			>
				<FontAwesome6 name="forward" size={iconSize} color={colors.text} />
			</TouchableOpacity>
		</Animated.View>
	)
})

export const SkipToPreviousButton = ({ iconSize = 30 }: PlayerButtonProps) => {
	const scaleAnim = useSharedValue(1)
	const offset = useRef(0)
	const { run } = useDebounceFn(
		async () => {
			const currentIndex = (await TrackPlayer.getActiveTrackIndex()) || 0
			const queue = await TrackPlayer.getQueue()
			const targetIndex = currentIndex + offset.current
			if (targetIndex < 0 || targetIndex > queue.length - 1 || offset.current < 2) {
				await TrackPlayer.skipToPrevious()
			} else {
				const current = queue[targetIndex]
				const fileExtension = current.basename.split('.').pop() || ''
				const fileName = `${current.basename}.${fileExtension}`
				const filePath = `${RNFS.DocumentDirectoryPath}/music_cache/${fileName}`
				await reCached(current.originalUrl, current.basename, filePath)
				await TrackPlayer.skip(targetIndex)
			}
		},
		{
			wait: 200,
		},
	)
	const animatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{ scale: scaleAnim.value }],
		}
	})

	const handlePressIn = () => {
		offset.current -= 1
		scaleAnim.value = withSpring(0.8) // 缩小到90%
	}

	const handlePressOut = () => {
		scaleAnim.value = withSpring(1) // 恢复到原始大小
	}

	return (
		<Animated.View style={animatedStyle}>
			<TouchableOpacity
				activeOpacity={0.85}
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				onPress={run}
				// 这里添加 Skip 的逻辑
			>
				<FontAwesome6 name="backward" size={iconSize} color={colors.text} />
			</TouchableOpacity>
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	container: {
		width: '100%',
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-evenly',
		alignItems: 'center',
	},
})

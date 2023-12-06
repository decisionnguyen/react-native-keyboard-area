import React, {
  forwardRef,
  ReactNode,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { RNKeyboard } from './module';
import Animated, {
  Easing,
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

// TODO: on ios try to make the animation smoother
// From: https://medium.com/man-moon/writing-modern-react-native-ui-e317ff956f02

interface IProps {
  style?: StyleProp<ViewStyle>;
  /**
   * If true, will keep the the keyboard area open even if the Keyboard is dismiss
   * Useful to switch to another view and then come back to the Keyboard view
   * NOTE: if false will not close the keyboard area to avoid layout jumping, use the close() method
   */
  isOpen?: boolean;
  /**
   * Content to be placed under the Keyboard
   */
  children: ReactNode;
  /**
   * Until the keyboard shows once, we don't know it real height,
   * so we need a initial default height
   * (Default: 250)
   */
  initialHeight?: number;
  /**
   * Minimum height for manually open view
   * (Default: 250)
   */
  minHeight?: number;
  /**
   * Event fired when keyboard height changes
   */
  onChange?: (isOpen: boolean, height: number) => void;
  /**
   * this is props
   */
  offsetHeight?: number;
}

export type KeyboardAreaRef = {
  isOpen: () => boolean;
  open: () => void;
  close: () => void;
};

export const KeyboardArea = forwardRef<KeyboardAreaRef, IProps>(
  (
    {
      style,
      children,
      isOpen: externalOpen,
      initialHeight = 250,
      minHeight = 250,
      onChange,
      offsetHeight = 0,
    },
    ref,
  ) => {
    const isOpen = useRef(false);
    const forceOpen = useRef(false);
    const keyboardHeight = useRef(initialHeight);
    const [currentHeight, setCurrentHeight] = useState(0);

    const keyboardAnimatedShow = useSharedValue(0);

    const animeStyle = useAnimatedStyle(() => {
      return {
        height: interpolate(
          keyboardAnimatedShow.value,
          [0, 1],
          [offsetHeight, keyboardHeight.current],
          { extrapolateRight: Extrapolate.CLAMP },
        ),
      };
    });

    const open = () => {
      isOpen.current = true;
      console.log(
        'open keyboardHeight.current = ',
        keyboardHeight.current,
        ' === ',
      );
      setCurrentHeight(keyboardHeight.current);
      keyboardAnimatedShow.value = withTiming(1, {
        duration: 200,
        easing: Easing.inOut(Easing.ease),
      });
      if (onChange) {
        onChange(true, keyboardHeight.current);
      }
    };

    const close = () => {
      isOpen.current = false;
      setCurrentHeight(0);
      keyboardAnimatedShow.value = withTiming(0, {
        duration: 200,
        easing: Easing.inOut(Easing.ease),
      });
      if (onChange) {
        onChange(false, 0);
      }
    };

    useImperativeHandle(ref, () => ({
      isOpen: () => isOpen.current,
      open,
      close,
    }));

    useEffect(() => {
      const keyboardHeightChanged = (height: number) => {
        if (height > 0 && height !== keyboardHeight.current) {
          // height > 0 check case sử dụng bàn phím ngoài
          keyboardHeight.current =
            height > offsetHeight ? height : offsetHeight;
        }
        const needToOpen = forceOpen.current || height > 0;
        if (needToOpen) {
          open();
        } else {
          close();
        }
      };
      RNKeyboard.addKeyboardListener(keyboardHeightChanged);
      return () => {
        RNKeyboard.removeKeyboardListener(keyboardHeightChanged);
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
      forceOpen.current = externalOpen || false;
      if (forceOpen.current) {
        open();
      }
    }, [externalOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    return <Animated.View style={animeStyle}>{children}</Animated.View>;
  },
);

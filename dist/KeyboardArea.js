import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { LayoutAnimation, Platform, View } from "react-native";
import { RNKeyboard } from "./module";
// TODO: on ios try to make the animation smoother
// From: https://medium.com/man-moon/writing-modern-react-native-ui-e317ff956f02
const _type = Platform.OS === "android" ? LayoutAnimation.Types.easeInEaseOut : LayoutAnimation.Types.keyboard;
const defaultAnimation = {
    duration: 200,
    create: {
        duration: 500,
        type: _type,
        property: LayoutAnimation.Properties.scaleXY
    },
    update: {
        type: _type,
        springDamping: 200
    }
};
export const KeyboardArea = forwardRef(({ style, children, isOpen: externalOpen, initialHeight = 250, minHeight = 250, onChange, offsetHeight = 0 }, ref) => {
    const isOpen = useRef(false);
    const forceOpen = useRef(false);
    const keyboardHeight = useRef(initialHeight);
    const [currentHeight, setCurrentHeight] = useState(0);
    const open = (hideAnimation = false) => {
        if (keyboardHeight.current !== currentHeight && !hideAnimation) {
            LayoutAnimation.configureNext(defaultAnimation);
        }
        isOpen.current = true;
        setCurrentHeight(keyboardHeight.current);
        if (onChange) {
            onChange(true, keyboardHeight.current);
        }
    };
    const close = () => {
        if (currentHeight !== 0) {
            LayoutAnimation.configureNext(defaultAnimation);
        }
        isOpen.current = false;
        setCurrentHeight(0);
        if (onChange) {
            onChange(false, 0);
        }
    };
    useImperativeHandle(ref, () => ({
        isOpen: () => isOpen.current,
        open,
        close
    }));
    useEffect(() => {
        const keyboardHeightChanged = (height) => {
            let hideAnimation = false;
            if (height > 0 && height !== keyboardHeight.current) {
                keyboardHeight.current = height > minHeight ? height : minHeight;
            }
            else {
                hideAnimation = true;
            }
            const needToOpen = forceOpen.current || height > 0;
            if (needToOpen) {
                open(hideAnimation || false);
            }
            else {
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
            open(false);
        }
    }, [externalOpen]); // eslint-disable-line react-hooks/exhaustive-deps
    return <View style={[{ height: currentHeight || offsetHeight }, style]}>{children}</View>;
});

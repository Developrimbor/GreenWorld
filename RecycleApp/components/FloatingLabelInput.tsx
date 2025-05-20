import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Animated,
  StyleSheet,
  TextInputProps,
  TouchableWithoutFeedback,
  TextStyle,
} from 'react-native';

interface FloatingLabelInputProps extends TextInputProps {
  label: string;
  isPassword?: boolean;
  rightIcon?: React.ReactNode;
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  value,
  onChangeText,
  isPassword = false,
  rightIcon,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: (isFocused || value) ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelStyle = {
    position: 'absolute' as const,
    left: 12,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [14, -8],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [14, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['#999', '#4B9363'],
    }),
    backgroundColor: '#fff',
    paddingHorizontal: 4,
    marginLeft: -4,
    zIndex: 1,
  };

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.label, labelStyle]}>
        {label}
      </Animated.Text>
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused
      ]}>
        <TextInput
          style={styles.input}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword}
          placeholderTextColor="#999"
          {...props}
        />
        {rightIcon && (
          <View style={styles.rightIcon}>
            {rightIcon}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    paddingTop: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 6,
    backgroundColor: '#fff',
    position: 'relative',
    zIndex: 0,
  },
  inputContainerFocused: {
    borderColor: '#4B9363',
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins-Regular',
  },
  label: {
    fontFamily: 'Poppins-Regular',
    letterSpacing: 0.3,
  },
  rightIcon: {
    paddingRight: 12,
  },
});

export default FloatingLabelInput; 
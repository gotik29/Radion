const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({ value, onChangeText, placeholder, multiline }) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedLabel = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedLabel, {
      toValue: (isFocused || value) ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelStyle = {
    position: 'absolute' as const,
    left: 12,
    top: animatedLabel.interpolate({
      inputRange: [0, 1],
      outputRange: [12, -6],
    }),
    fontSize: animatedLabel.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 2,
  };

  return (
    <View style={{ paddingTop: 12, marginBottom: 8 }}>
      <Animated.Text style={labelStyle}>{placeholder}</Animated.Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={{
          height: multiline ? 80 : 40,
          borderRadius: 8,
          backgroundColor: '#f3f4f6',
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 16,
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        multiline={multiline}
      />
    </View>
  );
};

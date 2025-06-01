import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import MessageBubble from '../components/MessageBubble';
import { Message } from '../types/Message';

const THINKING_DOTS = ['', '.', '..', '...'];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your movie assistant with a new pink look! Ask me anything about movies, actors, or recommendations!',
      role: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingText, setThinkingText] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const typingDots = useRef(new Animated.Value(0)).current;
  
  // Generate thinking animation
  useEffect(() => {
    if (isLoading) {
      let index = 0;
      const interval = setInterval(() => {
        setThinkingText(`Thinking${THINKING_DOTS[index % THINKING_DOTS.length]}`);
        index += 1;
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isLoading]);
  
  // Generate suggestion
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      const suggestions = [
        "What movies would you recommend for date night?",
        "Who's your favorite director?",
        "What are the best sci-fi movies of the last decade?",
        "Tell me about the latest Marvel movie",
        "What's your favorite movie soundtrack?",
        "Recommend me a comedy from the 90s"
      ];
      setSuggestion(suggestions[Math.floor(Math.random() * suggestions.length)]);
    }
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // First try your local movie agent
      let aiResponseText = '';
      
      try {
        const localResponse = await fetch('http://localhost:4111/api/agents/movieAgent/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: 'user', content: userMessage.text }
            ]
          }),
        });

        if (localResponse.ok) {
          const localData = await localResponse.json();
          aiResponseText = localData.text || '';
        } else {
          throw new Error('Local server not responding');
        }
      } catch (localError) {
        console.log('Local server unavailable, using fallback AI...');
        
        // Fallback to our free AI API with movie-focused system prompt
        const fallbackResponse = await fetch('https://api.a0.dev/ai/llm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: 'You are a helpful movie expert assistant. You know about movies, actors, directors, genres, recommendations, and film history. Always provide engaging and informative responses about movies. Your responses should be enthusiastic and friendly with a conversational tone.'
              },
              {
                role: 'user',
                content: userMessage.text
              }
            ]
          }),
        });

        if (!fallbackResponse.ok) {
          throw new Error('Both local and fallback APIs failed');
        }

        const fallbackData = await fallbackResponse.json();
        aiResponseText = fallbackData.completion || 'Sorry, I couldn\'t generate a response.';
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Unable to connect to movie agent. Please check your connection.');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I\'m having trouble connecting right now. Please try again in a moment!',
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const useSuggestion = () => {
    setInputText(suggestion);
  };

  const clearChat = () => {
    toast.success('Chat cleared!');
    setMessages([
      {
        id: '1',
        text: 'Chat cleared! How can I help you with movies today?',
        role: 'assistant',
        timestamp: new Date(),
      },
    ]);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <Ionicons name="film" size={24} color="#fff" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Movie Chat</Text>
            <Text style={styles.headerSubtitle}>
              {isLoading ? thinkingText : 'Online'}
            </Text>
          </View>
          <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
            <Ionicons name="trash-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.welcomeImageContainer}>
            <Image 
              source={{ uri: 'https://api.a0.dev/assets/image?text=Movie%20Chat%20AI&aspect=1:1&seed=123' }} 
              style={styles.welcomeImage} 
              resizeMode="cover"
            />
          </View>
          
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {isLoading && (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color="#FF5E9E" />
                <Text style={styles.loadingText}>{thinkingText}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {suggestion && !isLoading && (
          <TouchableOpacity style={styles.suggestionContainer} onPress={useSuggestion}>
            <Text style={styles.suggestionText}>
              <Ionicons name="bulb-outline" size={16} color="#FF5E9E" /> {suggestion}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about movies..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={(!inputText.trim() || isLoading) ? '#ccc' : '#fff'} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9FB', // Light pink background
  },
  header: {
    backgroundColor: '#FF5E9E', // Pink header
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFD1E0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  welcomeImageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  welcomeImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#FFD1E0',
  },
  loadingContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD1E0',
    borderBottomLeftRadius: 4,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF5E9E',
  },
  inputContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#FFD1E0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFF9FB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#FFD1E0',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: '#FF5E9E',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#FFCCE0',
  },
  suggestionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 209, 224, 0.2)',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  suggestionText: {
    fontSize: 14,
    color: '#FF5E9E',
    textAlign: 'center',
  },
});
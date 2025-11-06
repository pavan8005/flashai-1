import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Volume2 } from "lucide-react";
import { AudioRecorder, convertBlobToBase64 } from "@/utils/audioRecorder";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

export function VoiceButton({ onTranscription, disabled }: VoiceButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recorder] = useState(() => new AudioRecorder());
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      await recorder.start();
      setIsRecording(true);
      toast({
        title: "Recording started",
        description: "Speak now...",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not start recording",
        variant: "destructive",
      });
    }
  };

  const stopRecording = async () => {
    try {
      const audioBlob = await recorder.stop();
      setIsRecording(false);
      
      toast({
        title: "Processing audio",
        description: "Converting speech to text...",
      });

      const base64Audio = await convertBlobToBase64(audioBlob);

      const { data, error } = await supabase.functions.invoke('speech-to-text', {
        body: { audio: base64Audio },
      });

      if (error) throw error;

      if (data?.text) {
        onTranscription(data.text);
        toast({
          title: "Transcription complete",
          description: "Your message has been converted",
        });
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not process audio",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      type="button"
      size="icon"
      variant={isRecording ? "destructive" : "outline"}
      onClick={isRecording ? stopRecording : startRecording}
      disabled={disabled}
      className={cn(
        "h-[60px] w-[60px] flex-shrink-0 transition-all",
        isRecording && "animate-pulse shadow-lg shadow-destructive/50"
      )}
    >
      {isRecording ? (
        <Square className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  );
}

export function SpeakButton({ text }: { text: string }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();

  const speak = async () => {
    try {
      setIsSpeaking(true);

      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice: 'alloy' },
      });

      if (error) throw error;

      if (data?.audioContent) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };

        await audio.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsSpeaking(false);
      toast({
        title: "Error",
        description: "Could not play audio",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={speak}
      disabled={isSpeaking}
      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <Volume2 className={cn("h-4 w-4", isSpeaking && "animate-pulse")} />
    </Button>
  );
}

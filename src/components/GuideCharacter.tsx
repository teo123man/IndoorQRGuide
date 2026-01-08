import guideIdle from "@/assets/guide-idle.png";
import guideTalking from "@/assets/guide-talking.png";

interface GuideCharacterProps {
  isSpeaking: boolean;
}

export const GuideCharacter = ({ isSpeaking }: GuideCharacterProps) => {
  return (
    <div className="w-28 h-28 flex-shrink-0">
      <img
        src={isSpeaking ? guideTalking : guideIdle}
        alt="Campus Guide"
        className="w-full h-full object-contain rotate-90"
      />
    </div>
  );
};

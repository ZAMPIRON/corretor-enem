import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Texto das questões vem em Markdown, com imagens hospedadas no enem.dev.
export default function Texto({ children }: { children: string | null }) {
  if (!children) return null;
  return (
    <div className="texto-questao">
      <Markdown remarkPlugins={[remarkGfm]} components={{ img: ({ src, alt }) => <img src={typeof src === "string" ? src : undefined} alt={alt || "Imagem da questão"} loading="lazy" /> }}>
        {children}
      </Markdown>
    </div>
  );
}

import { useRef } from 'react';
import type { ImageSrc } from '../types';

interface Props {
  src: ImageSrc;
  defaultSrc: string;
  onChange: (src: ImageSrc) => void;
  className: string;
  label: string;
}

const MAX_BYTES = 1.5 * 1024 * 1024;

export function ImageSlot({ src, defaultSrc, onChange, className, label }: Props) {
  const input = useRef<HTMLInputElement>(null);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      alert('이미지는 1.5MB 이하만 사용할 수 있어요.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  const resolved = src === 'default' ? defaultSrc : src;

  return (
    <div className={`image-slot ${className} ${resolved ? '' : 'is-empty'}`}>
      {resolved ? (
        <img src={resolved} alt={label} draggable={false} />
      ) : (
        <button type="button" className="image-slot__add screen-only" onClick={() => input.current?.click()}>
          + {label}
        </button>
      )}
      {resolved && (
        <div className="image-slot__controls screen-only">
          <button type="button" onClick={() => input.current?.click()}>변경</button>
          {src !== 'default' && (
            <button type="button" onClick={() => onChange('default')}>기본</button>
          )}
          <button type="button" onClick={() => onChange(null)}>제거</button>
        </div>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}

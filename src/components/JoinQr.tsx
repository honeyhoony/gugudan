"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

export function JoinQr({ code }: { code: string }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/play/${code}`);
  }, [code]);

  if (!url) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-2xl bg-white p-3">
        <QRCodeSVG value={url} size={168} level="M" includeMargin={false} />
      </div>
      <p className="text-center text-sm text-white/60">
        휴대폰 카메라로 스캔
        <br />
        또는 코드 입력
      </p>
    </div>
  );
}

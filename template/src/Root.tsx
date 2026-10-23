import React from "react";
import { Composition } from "remotion";
import { Episode, episodeFrames } from "./Episode";

export const RemotionRoot: React.FC = () => (
  <Composition id="Episode" component={Episode} durationInFrames={episodeFrames()} fps={30} width={1920} height={1080} />
);

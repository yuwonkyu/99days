import { RegionId, Gender } from '../types/character';

// Temporary placeholder name pools, one small list per region/gender.
// Intended to be replaced with a richer, culturally distinct pool later
// (see docs/design/03-character-generation.md).
const NAME_POOLS: Record<RegionId, Record<Gender, string[]>> = {
  northern_highlands: {
    male: ['가른', '토빅', '울프렌', '하겐', '브로크'],
    female: ['에일라', '스카디', '리브렌', '헬가', '토바'],
  },
  forest_tribes: {
    male: ['라켄', '뮤어', '세드릭', '핀', '오웨인'],
    female: ['윌로우', '페른', '나야', '리안', '세일라'],
  },
  river_trade_city: {
    male: ['다리오', '마르코', '이안', '벨로스', '탈룬'],
    female: ['카밀라', '이졸데', '리네트', '베라', '소피아'],
  },
  eastern_dynasty: {
    male: ['진호', '단유', '위안', '하람', '태오'],
    female: ['소예', '린', '아영', '월하', '단이'],
  },
  western_feudal: {
    male: ['에드먼드', '길버트', '로랑', '휴고', '알라릭'],
    female: ['엘레노어', '이자벨', '마고', '아그네스', '클레어'],
  },
};

export function randomName(regionId: RegionId, gender: Gender): string {
  const pool = NAME_POOLS[regionId][gender];
  return pool[Math.floor(Math.random() * pool.length)];
}

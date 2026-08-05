import { SceneMode } from '../types/game';
import { eunNeun, iGa, eulReul } from '../engine/korean';
import { JOBS, JobCategory } from './jobs';

/**
 * Doc 04: offline fallback content library. Instead of one static paragraph per
 * "situation", each seed is a small function that can pick from flavor-word
 * banks — so 40 hand-authored seeds render as well over 100 distinct outputs,
 * and adding more banks/seeds over time scales toward the long-term 999 goal
 * without needing 999 hand-written paragraphs. `bond` covers positive-emotion
 * beats (affection/friendship) alongside the conflict-leaning categories.
 */
export type SituationCategory = 'danger' | 'work' | 'social' | 'mystery' | 'horror' | 'comedy' | 'bond';
export type ChoiceLean = 'safe' | 'neutral' | 'risky';

export interface SeedContext {
  name: string;
  job: string;
  personality: string;
}

export interface SeedChoice {
  text: string;
  lean: ChoiceLean;
}

export interface SituationSeed {
  id: string;
  mode: SceneMode;
  category: SituationCategory;
  situation: string;
  choices: SeedChoice[];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const STRANGERS = ['낯선 나그네', '떠돌이 상인', '말수 적은 노인', '몸을 사리는 청년', '수상한 사내'];
const THREATS = ['도적 무리', '굶주린 들짐승', '정체 모를 그림자', '흉흉한 소문의 장본인', '낫을 든 사내'];
const OMENS = ['까마귀 떼', '핏자국', '깨진 부적', '타다 만 편지', '부러진 화살'];
const NOISES = ['긁는 소리', '숨죽인 발소리', '희미한 신음', '금속이 부딪히는 소리', '알 수 없는 웃음소리'];
export const TIME_MOODS = ['이른 아침', '해 질 무렵', '비 오는 오후', '유난히 조용한 오전', '바람이 매섭게 부는 밤'];

/**
 * 플레이 피드백("무난한 일상에도 사건이 자주 생겼으면 좋겠다" — 농부의 양이 울타리를 넘거나,
 * 경비가 월담 시도를 알아채는 것처럼)에 대응한 직업군별 돌발 사건 뱅크. 같은 '일하는 중' 시드라도
 * 직업에 따라 다른 소동이 벌어지도록 job → category로 매핑해 골라 쓴다.
 */
const JOB_INCIDENTS: Record<JobCategory, string[]> = {
  labor: [
    '기르던 가축 몇 마리가 울타리를 넘어 달아났다',
    '짐수레 바퀴가 진창에 빠져 오도 가도 못하게 됐다',
    '헛간 지붕이 새는 걸 뒤늦게 발견했다',
  ],
  combat: [
    '담장 너머로 누군가 넘어오려는 낌새를 챘다',
    '순찰하던 길목에 낯선 발자국이 새로 나 있다',
    '무기고 자물쇠가 억지로 열린 흔적을 발견했다',
  ],
  scholar: [
    '필사하던 문서 한 장이 바람에 날아가 버렸다',
    '빌려준 책이 험하게 훼손된 채 돌아왔다',
    '기록해두었던 장부 한 페이지가 통째로 사라졌다',
  ],
  merchant: [
    '거스름돈 계산이 자꾸 맞지 않는다',
    '단골 손님이 외상값을 갚지 않고 자취를 감췄다',
    '들여온 물건 일부가 상해 못 쓰게 됐다',
  ],
  other: [
    '기르던 짐승들이 갑자기 소란스러워졌다',
    '처음 맡아보는 낯선 냄새가 코를 찌른다',
    '늘 다니던 길목에 못 보던 표식이 그려져 있다',
  ],
};

function jobCategoryOf(jobLabel: string): JobCategory {
  return JOBS.find((j) => j.label === jobLabel)?.category ?? 'other';
}

/** Doc 04: 12 buckets (mode × category) × 3 seeds each = 36 authored, well over 100 combined renders. */
export function buildSituationSeeds(ctx: SeedContext): SituationSeed[] {
  const { name, job, personality } = ctx;
  const jobCategory = jobCategoryOf(job);
  const 은는 = eunNeun(name);
  const 이가 = iGa(name);
  const 을를 = eulReul(name);

  return [
    // OUTDOOR × danger
    {
      id: 'od-danger-1',
      mode: 'outdoor',
      category: 'danger',
      situation: `산길이 좁아지는 지점에서 ${name}${은는} ${pick(THREATS)}의 기척을 느낀다. 되돌아가기엔 너무 멀리 왔다.`,
      choices: [
        { text: '빠르게 앞질러 지나간다', lean: 'risky' },
        { text: '몸을 숨기고 지나가길 기다린다', lean: 'safe' },
        { text: '정면으로 맞서기로 한다', lean: 'risky' },
        { text: '지형을 이용해 우회한다', lean: 'neutral' },
      ],
    },
    {
      id: 'od-danger-2',
      mode: 'outdoor',
      category: 'danger',
      situation: `사냥감을 쫓던 ${name}${이가} 오히려 부상당한 맹수와 정면으로 마주친다. 궁지에 몰린 짐승의 눈이 사납다.`,
      choices: [
        { text: '천천히 물러선다', lean: 'safe' },
        { text: '무기를 들고 대응한다', lean: 'risky' },
        { text: '큰 소리를 내 쫓아본다', lean: 'neutral' },
      ],
    },
    {
      id: 'od-danger-3',
      mode: 'outdoor',
      category: 'danger',
      situation: `호위 없이 물건을 옮기던 중, ${name}${을를} 눈여겨보는 시선이 느껴진다. ${pick(THREATS)}일지도 모른다.`,
      choices: [
        { text: '길을 바꿔 사람 많은 쪽으로 간다', lean: 'safe' },
        { text: '먼저 다가가 정체를 확인한다', lean: 'risky' },
      ],
    },

    // OUTDOOR × work
    {
      id: 'od-work-1',
      mode: 'outdoor',
      category: 'work',
      situation: `시장 한복판, ${name}의 앞에 ${pick(STRANGERS)}가 좌판을 펼친다. 값싼 물건 사이로 사연 있어 보이는 물건이 눈에 띈다.`,
      choices: [
        { text: '값을 흥정해 본다', lean: 'neutral' },
        { text: '물건의 출처를 캐묻는다', lean: 'risky' },
        { text: '무시하고 지나간다', lean: 'safe' },
      ],
    },
    {
      id: 'od-work-2',
      mode: 'outdoor',
      category: 'work',
      situation: `${pick(TIME_MOODS)}, ${job}으로서 오늘 맡은 일이 예상보다 커졌다. 도와줄 사람은 없고, 서둘러야 한다.`,
      choices: [
        { text: '혼자서라도 끝까지 해본다', lean: 'risky' },
        { text: '할 수 있는 만큼만 하고 내일로 미룬다', lean: 'safe' },
      ],
    },
    {
      id: 'od-work-3',
      mode: 'outdoor',
      category: 'work',
      situation: `${pick(TIME_MOODS)}, 고용주가 ${name}에게 원래 약속과 다른 무리한 일을 추가로 요구한다. 거절하면 삯을 못 받을 수도 있다.`,
      choices: [
        { text: '군말 없이 따른다', lean: 'safe' },
        { text: '정색하고 원래 조건대로만 하겠다 한다', lean: 'risky' },
        { text: '적당히 타협안을 제시한다', lean: 'neutral' },
      ],
    },

    // OUTDOOR × social
    {
      id: 'od-social-1',
      mode: 'outdoor',
      category: 'social',
      situation: `저녁, 마을 사람들이 모임을 갖는 자리에 ${personality} ${name}도 어울리게 된다. 누군가 ${job}에 대해 농담을 던진다.`,
      choices: [
        { text: '웃어넘긴다', lean: 'safe' },
        { text: '정색하며 받아친다', lean: 'risky' },
        { text: '자리를 슬쩍 피한다', lean: 'safe' },
      ],
    },
    {
      id: 'od-social-2',
      mode: 'outdoor',
      category: 'social',
      situation: `${pick(TIME_MOODS)}, 길에서 오래전 떠났던 옛 지인과 우연히 마주친다. 반가움과 어색함이 동시에 밀려온다.`,
      choices: [
        { text: '먼저 반갑게 인사한다', lean: 'neutral' },
        { text: '못 본 척 지나친다', lean: 'safe' },
        { text: '그동안의 사정을 캐묻는다', lean: 'risky' },
      ],
    },
    {
      id: 'od-social-3',
      mode: 'outdoor',
      category: 'social',
      situation: `${pick(TIME_MOODS)}, ${pick(STRANGERS)}가 ${name}에게 다급히 다가와 도움을 청한다. 사정이 딱해 보이지만 진짜인지는 알 수 없다.`,
      choices: [
        { text: '이유부터 자세히 묻는다', lean: 'neutral' },
        { text: '일단 도와준다', lean: 'risky' },
        { text: '정중히 거절하고 자리를 뜬다', lean: 'safe' },
      ],
    },

    // OUTDOOR × mystery
    {
      id: 'od-mystery-1',
      mode: 'outdoor',
      category: 'mystery',
      situation: `숲 가장자리에서 ${personality} 성격의 ${name}${이가} 낯선 발자국을 발견한다. 사람 것치고는 너무 크고, 짐승 것치고는 너무 규칙적이다.`,
      choices: [
        { text: '발자국을 따라가 본다', lean: 'risky' },
        { text: '거리를 두고 지켜본다', lean: 'neutral' },
        { text: '왔던 길로 되돌아간다', lean: 'safe' },
        { text: '돌을 던져 반응을 확인한다', lean: 'risky' },
      ],
    },
    {
      id: 'od-mystery-2',
      mode: 'outdoor',
      category: 'mystery',
      situation: (() => {
        const omen = pick(OMENS);
        return `길가에 ${omen}${iGa(omen)} 놓여 있다. 누군가 일부러 두고 간 것 같은 느낌을 지울 수 없다.`;
      })(),
      choices: [
        { text: '가까이 다가가 살펴본다', lean: 'risky' },
        { text: '주변에 아는 사람이 있는지 물어본다', lean: 'neutral' },
        { text: '괜히 엮이기 싫어 지나친다', lean: 'safe' },
      ],
    },
    {
      id: 'od-mystery-3',
      mode: 'outdoor',
      category: 'mystery',
      situation: `늘 다니던 길에 못 보던 샛길이 나 있다. ${name}${은는} 그 길이 어디로 이어지는지 문득 궁금해진다.`,
      choices: [
        { text: '호기심을 참지 못하고 들어가 본다', lean: 'risky' },
        { text: '다음에 시간 날 때 살펴보기로 한다', lean: 'safe' },
        { text: '마을 사람들에게 물어본다', lean: 'neutral' },
      ],
    },

    // OUTDOOR × horror
    {
      id: 'od-horror-1',
      mode: 'outdoor',
      category: 'horror',
      situation: (() => {
        const noise = pick(NOISES);
        return `인적 없는 길, ${name}${은는} 등 뒤에서 ${noise}${eulReul(noise)} 듣는다. 돌아봐도 아무도 없다.`;
      })(),
      choices: [
        { text: '걸음을 재촉해 벗어난다', lean: 'safe' },
        { text: '숨을 죽이고 소리의 정체를 살핀다', lean: 'risky' },
        { text: '큰 소리로 누구냐고 외친다', lean: 'neutral' },
        { text: '가만히 서서 기다려본다', lean: 'risky' },
      ],
    },
    {
      id: 'od-horror-2',
      mode: 'outdoor',
      category: 'horror',
      situation: `늘 사람으로 북적이던 마을 어귀가 오늘따라 텅 비어 있다. 어디선가 ${pick(NOISES)}만 들려온다.`,
      choices: [
        { text: '조심스레 마을 안으로 들어간다', lean: 'risky' },
        { text: '멀리서 상황을 지켜본다', lean: 'safe' },
        { text: '이웃 마을로 발길을 돌린다', lean: 'safe' },
      ],
    },
    {
      id: 'od-horror-3',
      mode: 'outdoor',
      category: 'horror',
      situation: `밤길을 걷던 ${name}${은는} 누군가 계속 자신을 지켜보고 있다는 느낌을 떨치지 못한다.`,
      choices: [
        { text: '뒤돌아서 정면으로 확인한다', lean: 'risky' },
        { text: '못 느낀 척 걸음만 재촉한다', lean: 'safe' },
        { text: '불빛이 있는 곳으로 방향을 튼다', lean: 'neutral' },
      ],
    },

    // OUTDOOR × comedy
    {
      id: 'od-comedy-1',
      mode: 'outdoor',
      category: 'comedy',
      situation: `술에 취한 사내가 ${name}${을를} 다른 사람으로 착각하고 대뜸 시비를 건다. 주변 사람들이 구경하기 시작한다.`,
      choices: [
        { text: '사람 잘못 봤다고 차분히 설명한다', lean: 'safe' },
        { text: '똑같이 큰소리로 맞선다', lean: 'risky' },
      ],
    },
    {
      id: 'od-comedy-2',
      mode: 'outdoor',
      category: 'comedy',
      situation: `${pick(TIME_MOODS)}, 장터에 풀려난 돼지 한 마리가 좌판을 뒤엎으며 난동을 부린다. 하필 ${name}${이가} 지나가던 길목이다.`,
      choices: [
        { text: '돼지를 잡으러 나선다', lean: 'risky' },
        { text: '멀찍이서 구경만 한다', lean: 'safe' },
        { text: '휘말리지 않게 재빨리 피한다', lean: 'safe' },
      ],
    },
    {
      id: 'od-comedy-3',
      mode: 'outdoor',
      category: 'comedy',
      situation: `${pick(TIME_MOODS)}, ${pick(STRANGERS)}가 ${name}${을를} 붙잡고 엉뚱한 사람과 헷갈려 반갑게 인사를 건넨다. 설명해도 좀처럼 믿지 않는다.`,
      choices: [
        { text: '끝까지 아니라고 해명한다', lean: 'neutral' },
        { text: '그냥 맞장구쳐 준다', lean: 'safe' },
        { text: '재미 삼아 더 얘기를 부풀린다', lean: 'risky' },
      ],
    },

    // SHELTER × danger
    {
      id: 'sh-danger-1',
      mode: 'shelter',
      category: 'danger',
      situation: `${name}의 거처 문에 억지로 열려 한 흔적이 남아 있다. 자는 사이 누군가 다녀간 것 같다.`,
      choices: [
        { text: '문단속을 강화하고 밤을 지새운다', lean: 'safe' },
        { text: '주변을 뒤져 흔적을 쫓는다', lean: 'risky' },
        { text: '이웃에게 알려 함께 살핀다', lean: 'neutral' },
        { text: '짐을 챙겨 다른 곳으로 옮긴다', lean: 'safe' },
      ],
    },
    {
      id: 'sh-danger-2',
      mode: 'shelter',
      category: 'danger',
      situation: `한밤중, 옆방에서 불씨가 옮겨붙었는지 매캐한 냄새가 올라온다. ${name}${은는} 서둘러야 한다.`,
      choices: [
        { text: '당장 물건을 챙겨 밖으로 나간다', lean: 'safe' },
        { text: '불부터 잡아본다', lean: 'risky' },
        { text: '이웃을 깨워 함께 대응한다', lean: 'neutral' },
      ],
    },
    {
      id: 'sh-danger-3',
      mode: 'shelter',
      category: 'danger',
      situation: `빚쟁이 몇 명이 ${name}의 거처 앞까지 찾아와 문을 두드리며 소란을 피운다.`,
      choices: [
        { text: '문을 열고 사정을 이야기한다', lean: 'neutral' },
        { text: '끝까지 문을 열지 않는다', lean: 'safe' },
        { text: '먼저 나가 강하게 맞선다', lean: 'risky' },
      ],
    },

    // SHELTER × work
    {
      id: 'sh-work-1',
      mode: 'shelter',
      category: 'work',
      situation: `좁은 방 안, ${name}${은는} 오늘 번 것과 남은 식량을 헤아려 본다. 셈이 맞지 않는다.`,
      choices: [
        { text: '다시 꼼꼼히 계산해 본다', lean: 'safe' },
        { text: '누군가 훔쳤다고 의심한다', lean: 'risky' },
      ],
    },
    {
      id: 'sh-work-2',
      mode: 'shelter',
      category: 'work',
      situation: `${pick(TIME_MOODS)}, ${job} 일에 쓰던 도구가 낡아 완전히 망가졌다. 고치지 않으면 내일 일을 나갈 수 없다.`,
      choices: [
        { text: '밤새 직접 고쳐본다', lean: 'risky' },
        { text: '돈을 들여 새로 장만한다', lean: 'safe' },
        { text: '이웃 도구를 잠시 빌려본다', lean: 'neutral' },
      ],
    },
    {
      id: 'sh-work-3',
      mode: 'shelter',
      category: 'work',
      situation: `${pick(TIME_MOODS)}, 집세 독촉장이 문틈에 꽂혀 있다. ${name}${은는} 기한까지 며칠 남지 않았음을 새삼 깨닫는다.`,
      choices: [
        { text: '있는 돈을 긁어모아 낸다', lean: 'safe' },
        { text: '집주인을 찾아가 기한을 미뤄달라 한다', lean: 'neutral' },
        { text: '일단 모른 척 미뤄둔다', lean: 'risky' },
      ],
    },

    // SHELTER × social
    {
      id: 'sh-social-1',
      mode: 'shelter',
      category: 'social',
      situation: `${pick(TIME_MOODS)}, 이웃이 급한 부탁을 하러 찾아온다. ${personality} ${name}${은는} 선뜻 답하기가 망설여진다.`,
      choices: [
        { text: '흔쾌히 들어준다', lean: 'safe' },
        { text: '사정을 더 물어본 뒤 결정한다', lean: 'neutral' },
        { text: '완곡히 거절한다', lean: 'safe' },
      ],
    },
    {
      id: 'sh-social-2',
      mode: 'shelter',
      category: 'social',
      situation: `같이 지내는 이와 사소한 일로 말다툼이 커진다. 좁은 거처 안이라 피할 곳도 마땅치 않다.`,
      choices: [
        { text: '먼저 사과하고 넘어간다', lean: 'safe' },
        { text: '끝까지 할 말을 다 한다', lean: 'risky' },
      ],
    },
    {
      id: 'sh-social-3',
      mode: 'shelter',
      category: 'social',
      situation: `${pick(TIME_MOODS)}, 예고 없이 손님이 거처를 찾아온다. 대접할 게 마땅치 않아 ${name}${은는} 난처해진다.`,
      choices: [
        { text: '있는 것으로 정성껏 대접한다', lean: 'neutral' },
        { text: '사정을 솔직히 이야기한다', lean: 'safe' },
        { text: '이웃에게 빌려서라도 채운다', lean: 'risky' },
      ],
    },

    // SHELTER × mystery
    {
      id: 'sh-mystery-1',
      mode: 'shelter',
      category: 'mystery',
      situation: `밤늦게 누군가 문을 두드린다. ${name}${은는} 숨을 죽이고 인기척을 살핀다. 아는 목소리는 아니다.`,
      choices: [
        { text: '문을 살짝 열어 확인한다', lean: 'risky' },
        { text: '못 들은 척 불을 끄고 기다린다', lean: 'safe' },
        { text: '누구냐고 안에서 물어본다', lean: 'neutral' },
        { text: '무시하고 다시 잠을 청한다', lean: 'safe' },
      ],
    },
    {
      id: 'sh-mystery-2',
      mode: 'shelter',
      category: 'mystery',
      situation: `짐을 정리하던 ${name}${은는} 자기 것이 아닌 물건 하나를 발견한다. 언제 어떻게 들어왔는지 짐작이 가지 않는다.`,
      choices: [
        { text: '주인을 수소문해 본다', lean: 'neutral' },
        { text: '일단 잘 보관해 둔다', lean: 'safe' },
        { text: '무엇인지 몰래 열어본다', lean: 'risky' },
      ],
    },
    {
      id: 'sh-mystery-3',
      mode: 'shelter',
      category: 'mystery',
      situation: `잠결에 문 열리는 소리를 들은 것 같은데, 깨어나 보니 아무도 없다. ${name}${은는} 찜찜함을 지우지 못한다.`,
      choices: [
        { text: '집 안을 샅샅이 살펴본다', lean: 'risky' },
        { text: '꿈이었으려니 하고 넘긴다', lean: 'safe' },
        { text: '문단속을 다시 확인한다', lean: 'neutral' },
      ],
    },

    // SHELTER × horror
    {
      id: 'sh-horror-1',
      mode: 'shelter',
      category: 'horror',
      situation: (() => {
        const noise = pick(NOISES);
        return `벽 너머에서 ${noise}${iGa(noise)} 밤새 그치지 않는다. 옆방은 분명 비어 있을 텐데.`;
      })(),
      choices: [
        { text: '벽에 귀를 대고 자세히 들어본다', lean: 'risky' },
        { text: '이불을 뒤집어쓰고 아침을 기다린다', lean: 'safe' },
        { text: '날이 밝는 대로 옆방을 확인한다', lean: 'neutral' },
      ],
    },
    {
      id: 'sh-horror-2',
      mode: 'shelter',
      category: 'horror',
      situation: `켜두었던 등불이 저절로 꺼지고, 문밖에서 발소리가 다가온다. ${name}${은는} 숨소리마저 조심스러워진다.`,
      choices: [
        { text: '조용히 무기가 될 만한 것을 찾는다', lean: 'risky' },
        { text: '숨죽이고 지나가길 기다린다', lean: 'safe' },
        { text: '큰 소리로 누구냐고 소리친다', lean: 'neutral' },
      ],
    },
    {
      id: 'sh-horror-3',
      mode: 'shelter',
      category: 'horror',
      situation: `자다 깬 ${name}${은는} 방 안의 물건들이 자기가 두었던 자리와 조금씩 다르다는 걸 알아챈다.`,
      choices: [
        { text: '기분 탓이라 여기고 다시 눕는다', lean: 'safe' },
        { text: '밤새 뜬눈으로 지켜본다', lean: 'risky' },
        { text: '날이 밝자마자 이웃과 상의한다', lean: 'neutral' },
      ],
    },

    // SHELTER × comedy
    {
      id: 'sh-comedy-1',
      mode: 'shelter',
      category: 'comedy',
      situation: `키우던 닭이 방 안까지 들어와 애써 정리한 살림을 온통 헤집어 놓았다. ${name}${은는} 할 말을 잃는다.`,
      choices: [
        { text: '한숨 쉬며 다시 정리한다', lean: 'safe' },
        { text: '닭을 쫓아다니며 잡으려 한다', lean: 'risky' },
      ],
    },
    {
      id: 'sh-comedy-2',
      mode: 'shelter',
      category: 'comedy',
      situation: `${pick(TIME_MOODS)}, 이웃이 남의 집 굴뚝 연기를 보고 ${name}의 거처에 불이 난 줄 알고 물동이를 들고 뛰어들어온다.`,
      choices: [
        { text: '오해라고 웃으며 설명한다', lean: 'safe' },
        { text: '고마운 마음에 차라도 대접한다', lean: 'neutral' },
        { text: '엉뚱한 소동에 그냥 웃고 만다', lean: 'safe' },
      ],
    },
    {
      id: 'sh-comedy-3',
      mode: 'shelter',
      category: 'comedy',
      situation: `${pick(TIME_MOODS)}, 어제 마신 술이 과했는지 ${name}${은는} 눈을 뜨자마자 아끼던 물건 하나를 깨뜨렸다는 걸 알게 된다.`,
      choices: [
        { text: '고칠 수 있을지 살펴본다', lean: 'neutral' },
        { text: '별일 아니라며 웃어넘긴다', lean: 'safe' },
        { text: '어제 일을 하나하나 되짚어본다', lean: 'risky' },
      ],
    },

    // OUTDOOR × bond (호감/우정/애정 — 위험·갈등만이 아니라 긍정적 관계 감정도)
    {
      id: 'od-bond-1',
      mode: 'outdoor',
      category: 'bond',
      situation: `${pick(TIME_MOODS)}, 장터에서 몇 번 마주친 ${pick(STRANGERS)}와 이야기를 나누다 보니 어느새 편해진 사이가 되어간다.`,
      choices: [
        { text: '먼저 다음에 또 보자고 청한다', lean: 'risky' },
        { text: '적당한 거리를 두며 대화를 이어간다', lean: 'neutral' },
        { text: '가볍게 인사만 하고 지나간다', lean: 'safe' },
      ],
    },
    {
      id: 'od-bond-2',
      mode: 'outdoor',
      category: 'bond',
      situation: `길에서 곤경에 처한 이를 도와준 인연으로, 그 사람이 ${personality} ${name}에게 은근한 호감을 내비친다.`,
      choices: [
        { text: '마음을 솔직히 표현해본다', lean: 'risky' },
        { text: '천천히 시간을 두고 지켜본다', lean: 'neutral' },
        { text: '부담스러워 거리를 둔다', lean: 'safe' },
      ],
    },

    // SHELTER × bond
    {
      id: 'sh-bond-1',
      mode: 'shelter',
      category: 'bond',
      situation: `${pick(TIME_MOODS)}, 함께 지내는 이가 평소와 달리 유독 다정하게 말을 건넨다. ${personality} ${name}${은는} 묘하게 마음이 쓰인다.`,
      choices: [
        { text: '마음을 열고 다가가 본다', lean: 'risky' },
        { text: '내색하지 않고 지켜본다', lean: 'neutral' },
        { text: '어색해서 화제를 돌린다', lean: 'safe' },
      ],
    },
    {
      id: 'sh-bond-2',
      mode: 'shelter',
      category: 'bond',
      situation: `요즘 이웃이 부쩍 자주 거처에 들른다. 단순한 친절 이상의 마음이 느껴져 ${name}${은는} 내심 신경이 쓰인다.`,
      choices: [
        { text: '차를 대접하며 이야기를 나눈다', lean: 'neutral' },
        { text: '넌지시 마음을 떠본다', lean: 'risky' },
        { text: '적당히 예의만 차리고 만다', lean: 'safe' },
      ],
    },

    // 직업별 돌발 사건 (JOB_INCIDENTS) — 같은 '일하는 중'이라도 직업에 따라 다른 소동이 벌어진다
    {
      id: 'od-work-4',
      mode: 'outdoor',
      category: 'work',
      situation: `한창 일하던 중, ${pick(JOB_INCIDENTS[jobCategory])}. ${name}${은는} 하던 일을 멈추고 서둘러야 한다.`,
      choices: [
        { text: '만사 제쳐두고 바로 뛰어가 수습한다', lean: 'risky' },
        { text: '순서를 따져가며 침착하게 처리한다', lean: 'safe' },
        { text: '주변 사람에게 도움을 청한다', lean: 'neutral' },
      ],
    },
    {
      id: 'sh-work-4',
      mode: 'shelter',
      category: 'work',
      situation: `거처에 머물던 중에도 일 걱정은 끊이지 않는다. ${pick(JOB_INCIDENTS[jobCategory])}는 소식이 뒤늦게 전해진다.`,
      choices: [
        { text: '당장 달려가 확인한다', lean: 'risky' },
        { text: '날이 밝으면 처리하기로 한다', lean: 'safe' },
        { text: '믿을 만한 이에게 부탁해 대신 살피게 한다', lean: 'neutral' },
      ],
    },

    // 평범한 하루에도 갑자기 끼어드는 사건 — 반복되는 잔잔한 전개에 변주를 준다
    {
      id: 'od-danger-4',
      mode: 'outdoor',
      category: 'danger',
      situation: `길 한복판에서 갑자기 놀란 말 한 마리가 고삐 풀린 채 ${name}${을를} 향해 곧장 달려온다. 피할 틈이 많지 않다.`,
      choices: [
        { text: '재빨리 옆으로 몸을 던진다', lean: 'safe' },
        { text: '고삐를 붙잡아 세워본다', lean: 'risky' },
        { text: '길가 사람들에게 소리쳐 알린다', lean: 'neutral' },
      ],
    },
    {
      id: 'sh-comedy-4',
      mode: 'shelter',
      category: 'comedy',
      situation: `조용히 지내던 중, 이웃집 짐승이 울타리를 넘어와 ${name}의 빨래를 죄다 물어뜯어 놓았다.`,
      choices: [
        { text: '짐승을 쫓아내고 주인을 찾아간다', lean: 'neutral' },
        { text: '그냥 웃어넘기고 다시 넌다', lean: 'safe' },
        { text: '화가 나 언성을 높인다', lean: 'risky' },
      ],
    },
    {
      id: 'od-social-4',
      mode: 'outdoor',
      category: 'social',
      situation: `요즘 부쩍 마주치는 ${pick(STRANGERS)}가 ${name}${을를} 은근히 견제하는 눈치다. 같은 자리를 두고 다투는 사이라는 소문도 있다.`,
      choices: [
        { text: '먼저 다가가 속내를 떠본다', lean: 'risky' },
        { text: '신경 쓰지 않고 할 일만 한다', lean: 'safe' },
        { text: '주변에 넌지시 사정을 물어본다', lean: 'neutral' },
      ],
    },
    {
      id: 'od-bond-3',
      mode: 'outdoor',
      category: 'bond',
      situation: `${job}으로서 해온 일을 눈여겨보던 이가 ${personality} ${name}에게 진심 어린 칭찬을 건넨다. 오랜만에 마음이 뿌듯해진다.`,
      choices: [
        { text: '고마움을 표현하며 대화를 이어간다', lean: 'neutral' },
        { text: '쑥스러워 얼버무리고 만다', lean: 'safe' },
        { text: '앞으로 더 잘해보고 싶어진다고 말한다', lean: 'risky' },
      ],
    },
  ];
}

/**
 * 99일 중 3번 배정되는 "진짜 죽을 수 있는" 위기 전용 시드. 일반 시드 풀과 분리해 두어
 * (storyFlow.ts의 crisisAhead) 오프라인 폴백도 이 순간만큼은 확실히 위험하게 만든다 —
 * 실제 심각도는 offlineGenerator.ts의 CRISIS_STAT_DELTA_BY_TIER가 결정한다.
 */
export function buildCrisisSeeds(ctx: SeedContext): SituationSeed[] {
  const { name, personality } = ctx;
  const 은는 = eunNeun(name);
  const 을를 = eulReul(name);

  return [
    {
      id: 'crisis-danger-1',
      mode: 'outdoor',
      category: 'danger',
      situation: `길목을 막아선 도적 무리가 ${name}${을를} 에워싼다. 여럿이 무기를 들었고, 도망칠 틈은 좁아 보인다.`,
      choices: [
        { text: '가진 것을 던지고 틈을 노려 달아난다', lean: 'safe' },
        { text: '순순히 요구에 따른다', lean: 'neutral' },
        { text: '무기를 들고 맞선다', lean: 'risky' },
      ],
    },
    {
      id: 'crisis-danger-2',
      mode: 'outdoor',
      category: 'danger',
      situation: `마른 숲에 붙은 불이 순식간에 번져 ${name}의 퇴로를 막는다. 연기 때문에 방향을 가늠하기도 어렵다.`,
      choices: [
        { text: '낮은 자세로 바람을 등지고 달린다', lean: 'safe' },
        { text: '물이 있는 쪽을 향해 곧장 뛴다', lean: 'neutral' },
        { text: '불길 사이 좁은 틈을 뚫고 지나간다', lean: 'risky' },
      ],
    },
    {
      id: 'crisis-danger-3',
      mode: 'outdoor',
      category: 'danger',
      situation: (() => {
        const threat = pick(['굶주린 늑대 무리', '흥분한 멧돼지 떼']);
        return `${threat}${iGa(threat)} ${name}${을를} 향해 다가온다. 나무를 오르기엔 늦었고, 무리는 점점 좁혀온다.`;
      })(),
      choices: [
        { text: '뒷걸음질치며 거리를 유지한다', lean: 'safe' },
        { text: '큰 소리와 몸짓으로 위협해본다', lean: 'neutral' },
        { text: '무기를 들고 정면으로 맞선다', lean: 'risky' },
      ],
    },
    {
      id: 'crisis-shelter-1',
      mode: 'shelter',
      category: 'danger',
      situation: `폭우로 지반이 무너지며 ${name}의 거처 지붕 한쪽이 순식간에 내려앉는다. 잔해에 깔리기 직전이다.`,
      choices: [
        { text: '몸을 던져 문밖으로 굴러 나간다', lean: 'safe' },
        { text: '기둥을 붙잡고 버텨본다', lean: 'neutral' },
        { text: '무너지는 쪽으로 뛰어들어 물건을 건진다', lean: 'risky' },
      ],
    },
    {
      id: 'crisis-shelter-2',
      mode: 'shelter',
      category: 'horror',
      situation: `${personality} ${name}${은는} 한밤중 고열과 극심한 오한에 잠에서 깬다. 상한 음식을 먹은 게 뒤늦게 떠오르지만, 도와줄 사람은 곁에 없다.`,
      choices: [
        { text: '억지로라도 물을 마시며 버틴다', lean: 'safe' },
        { text: '이웃을 깨워 도움을 청한다', lean: 'neutral' },
        { text: '남은 약초를 한꺼번에 삼킨다', lean: 'risky' },
      ],
    },
  ];
}

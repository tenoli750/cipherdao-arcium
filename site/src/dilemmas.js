(function () {
  const categories = {
    daily: { en: "Daily Life", ko: "일상/생활" },
    food: { en: "Food", ko: "음식" },
    money: { en: "Money & Abilities", ko: "돈/능력" },
    friends: { en: "Friends", ko: "친구/인간관계" },
    dating: { en: "Dating", ko: "연애" },
    work: { en: "School & Work", ko: "학교/직장" },
    powers: { en: "Superpowers", ko: "초능력/상상" },
    absurd: { en: "Absurd", ko: "웃긴 선택지" },
    hygiene: { en: "Hygiene Chaos", ko: "위생/찝찝함" }
  };

  const dilemmas = [
    {
      id: "daily-morning-night",
      category: "daily",
      a: { en: "Live as a morning person forever", ko: "평생 아침형 인간으로 살기" },
      b: { en: "Live as a night owl forever", ko: "평생 새벽형 인간으로 살기" }
    },
    {
      id: "daily-auto-wake-sleep",
      category: "daily",
      a: { en: "Automatically wake up at 7 AM every day", ko: "매일 7시에 자동 기상" },
      b: { en: "Sleep whenever you want and always get 8 perfect hours", ko: "매일 원하는 시간에 자도 8시간 숙면 보장" }
    },
    {
      id: "daily-no-elevator-escalator",
      category: "daily",
      a: { en: "Never use elevators again", ko: "평생 엘리베이터 못 타기" },
      b: { en: "Never use escalators again", ko: "평생 에스컬레이터 못 타기" }
    },
    {
      id: "daily-phone-wallet",
      category: "daily",
      a: { en: "Spend a whole day without your phone", ko: "하루 종일 핸드폰 없이 살기" },
      b: { en: "Spend a whole day without your wallet", ko: "하루 종일 지갑 없이 살기" }
    },
    {
      id: "daily-summer-winter",
      category: "daily",
      a: { en: "Live in endless summer", ko: "평생 여름만 살기" },
      b: { en: "Live in endless winter", ko: "평생 겨울만 살기" }
    },
    {
      id: "daily-wide-home-transit",
      category: "daily",
      a: { en: "Huge home, terrible transit", ko: "집은 엄청 넓은데 교통 최악" },
      b: { en: "Tiny home, perfect transit", ko: "집은 좁은데 교통 최고" }
    },
    {
      id: "food-no-chicken-pizza",
      category: "food",
      a: { en: "Never eat fried chicken again", ko: "평생 치킨 못 먹기" },
      b: { en: "Never eat pizza again", ko: "평생 피자 못 먹기" }
    },
    {
      id: "food-no-tteokbokki-ramen",
      category: "food",
      a: { en: "Give up tteokbokki forever", ko: "떡볶이 평생 금지" },
      b: { en: "Give up ramen forever", ko: "라면 평생 금지" }
    },
    {
      id: "food-bland-salty",
      category: "food",
      a: { en: "Every meal is slightly bland", ko: "모든 음식이 조금 싱거움" },
      b: { en: "Every meal is slightly too salty", ko: "모든 음식이 조금 짬" }
    },
    {
      id: "food-spicy-sweet",
      category: "food",
      a: { en: "Never eat spicy food again", ko: "평생 매운 음식 못 먹기" },
      b: { en: "Never eat sweet food again", ko: "평생 단 음식 못 먹기" }
    },
    {
      id: "food-americano-latte",
      category: "food",
      a: { en: "Only drink Americanos forever", ko: "평생 아메리카노만 마시기" },
      b: { en: "Only drink lattes forever", ko: "평생 라떼만 마시기" }
    },
    {
      id: "food-waiting-average",
      category: "food",
      a: { en: "Wait two hours for a famous restaurant", ko: "맛집 웨이팅 2시간 하기" },
      b: { en: "Eat immediately somewhere average", ko: "바로 먹지만 맛은 평범한 집 가기" }
    },
    {
      id: "money-now-billion-monthly",
      category: "money",
      a: { en: "Get 100 million won right now", ko: "지금 당장 1억 받기" },
      b: { en: "Get 1 million won every month for life", ko: "매달 100만 원씩 평생 받기" }
    },
    {
      id: "money-time",
      category: "money",
      a: { en: "Have money but no time", ko: "돈은 많은데 시간이 없음" },
      b: { en: "Have time but not enough money", ko: "시간은 많은데 돈이 부족함" }
    },
    {
      id: "money-six-four-work",
      category: "money",
      a: { en: "Double salary, six-day workweek", ko: "월급 2배지만 주 6일 근무" },
      b: { en: "Same salary, four-day workweek", ko: "월급 그대로지만 주 4일 근무" }
    },
    {
      id: "money-delivery-taxi",
      category: "money",
      a: { en: "Free delivery forever", ko: "평생 공짜 배달" },
      b: { en: "Free taxis forever", ko: "평생 공짜 택시" }
    },
    {
      id: "money-rent-food",
      category: "money",
      a: { en: "Never pay rent again", ko: "평생 집세 없음" },
      b: { en: "Never pay for food again", ko: "평생 식비 없음" }
    },
    {
      id: "friends-many-one",
      category: "friends",
      a: { en: "Have 100 friends but no deep connection", ko: "친구 100명인데 깊은 친구 없음" },
      b: { en: "Have one truly ride-or-die friend", ko: "친구 1명인데 완전 찐친" }
    },
    {
      id: "friends-secret-history",
      category: "friends",
      a: { en: "One friend knows your secret", ko: "내 비밀을 친구 1명이 알기" },
      b: { en: "100 strangers know your most embarrassing era", ko: "내 흑역사를 모르는 사람 100명이 알기" }
    },
    {
      id: "friends-late-early",
      category: "friends",
      a: { en: "Your friend is always 10 minutes late", ko: "친구가 약속 매번 10분 늦음" },
      b: { en: "Your friend always arrives one hour early", ko: "친구가 약속 매번 1시간 일찍 옴" }
    },
    {
      id: "friends-fact-comfort",
      category: "friends",
      a: { en: "A friend who tells brutal truths", ko: "친구가 팩폭 잘함" },
      b: { en: "A friend who only comforts you", ko: "친구가 위로만 해줌" }
    },
    {
      id: "dating-contact-trust",
      category: "dating",
      a: { en: "A partner who texts every day", ko: "매일 연락하는 애인" },
      b: { en: "A partner you trust even without constant texts", ko: "자주 안 해도 믿음 가는 애인" }
    },
    {
      id: "dating-taste-personality",
      category: "dating",
      a: { en: "A partner with exactly your taste", ko: "취향이 완전 같은 애인" },
      b: { en: "A partner whose personality fits perfectly", ko: "성격이 완전 잘 맞는 애인" }
    },
    {
      id: "dating-words-actions",
      category: "dating",
      a: { en: "Someone who says beautiful things", ko: "말을 예쁘게 하는 애인" },
      b: { en: "Someone who proves it through actions", ko: "행동으로 잘 보여주는 애인" }
    },
    {
      id: "dating-fast-cold-slow-warm",
      category: "dating",
      a: { en: "Fast replies, stiff tone", ko: "연락은 빠른데 말투 딱딱함" },
      b: { en: "Slow replies, warm tone", ko: "연락은 느린데 말투 다정함" }
    },
    {
      id: "work-cramming-focus",
      category: "work",
      a: { en: "Always succeed at last-minute studying", ko: "시험 전날 벼락치기 성공 능력" },
      b: { en: "Have double focus while studying normally", ko: "평소 공부 집중력 2배 능력" }
    },
    {
      id: "work-present-test",
      category: "work",
      a: { en: "Great at presentations, bad at tests", ko: "발표는 잘하지만 시험 못 봄" },
      b: { en: "Great at tests, bad at presentations", ko: "시험은 잘 보지만 발표 못함" }
    },
    {
      id: "work-strict-indifferent",
      category: "work",
      a: { en: "A boss or teacher who is too strict", ko: "상사/선생님이 너무 엄격함" },
      b: { en: "A boss or teacher who does not care at all", ko: "상사/선생님이 너무 무관심함" }
    },
    {
      id: "work-praise-reward",
      category: "work",
      a: { en: "Lots of praise, no rewards", ko: "칭찬은 많은데 보상 없음" },
      b: { en: "No praise, guaranteed rewards", ko: "칭찬은 없는데 보상 확실함" }
    },
    {
      id: "powers-teleport-time",
      category: "powers",
      a: { en: "Teleportation", ko: "순간이동 능력" },
      b: { en: "Pause time", ko: "시간 멈추기 능력" }
    },
    {
      id: "powers-animals-minds",
      category: "powers",
      a: { en: "Talk to animals", ko: "동물과 대화 가능" },
      b: { en: "Read one person's mind once a day", ko: "사람의 속마음 하루 1번 읽기 가능" }
    },
    {
      id: "powers-language-instrument",
      category: "powers",
      a: { en: "Speak every language", ko: "모든 언어 가능" },
      b: { en: "Play every instrument", ko: "모든 악기 가능" }
    },
    {
      id: "powers-wifi-battery",
      category: "powers",
      a: { en: "Have Wi-Fi everywhere", ko: "어디서든 와이파이 잡힘" },
      b: { en: "Keep your battery at 100% everywhere", ko: "어디서든 배터리 100% 유지" }
    },
    {
      id: "absurd-bgm-sfx",
      category: "absurd",
      a: { en: "Background music plays whenever you talk", ko: "말할 때마다 배경음악 나옴" },
      b: { en: "Sound effects play whenever you walk", ko: "걸을 때마다 효과음 나옴" }
    },
    {
      id: "absurd-subtitles-emojis",
      category: "absurd",
      a: { en: "Your thoughts appear as subtitles", ko: "내 생각이 자막으로 보임" },
      b: { en: "Your emotions appear as emojis above your head", ko: "내 감정이 이모티콘으로 머리 위에 뜸" }
    },
    {
      id: "absurd-news-variety",
      category: "absurd",
      a: { en: "Talk like a news anchor all day", ko: "하루 종일 말투가 뉴스 앵커 같아짐" },
      b: { en: "Talk like a variety-show caption all day", ko: "하루 종일 말투가 예능 자막 같아짐" }
    },
    {
      id: "absurd-selfie-photo",
      category: "absurd",
      a: { en: "Great selfies, terrible photos taken by others", ko: "셀카는 잘 나오는데 남이 찍어준 사진 망함" },
      b: { en: "Great photos taken by others, terrible selfies", ko: "남이 찍어준 사진은 잘 나오는데 셀카 망함" }
    },
    {
      id: "hygiene-shampoo-smell-fake-clean",
      category: "hygiene",
      a: { en: "Your shampoo smell stays way too strong for three days", ko: "머리 감았는데 샴푸 향이 3일 동안 너무 진하게 남기" },
      b: { en: "You did not wash your hair but must act like nothing smells", ko: "머리 안 감았는데 아무 냄새도 안 나는 척하기" }
    },
    {
      id: "hygiene-feet-body",
      category: "hygiene",
      a: { en: "Shower but somehow forget only your feet", ko: "샤워했는데 발만 안 씻기" },
      b: { en: "Wash your feet properly but only rinse the rest with water", ko: "발은 씻었는데 몸 전체 물샤워만 하기" }
    },
    {
      id: "hygiene-brush-tongue",
      category: "hygiene",
      a: { en: "Brush your teeth but never use a tongue scraper", ko: "양치했는데 혀클리너 못 쓰기" },
      b: { en: "Use a tongue scraper but never brush your teeth", ko: "혀클리너는 했는데 양치 못 하기" }
    },
    {
      id: "hygiene-old-clothes-new-clothes",
      category: "hygiene",
      a: { en: "Shower, then put your old clothes back on", ko: "샤워 후 깨끗한 옷 없어서 입던 옷 다시 입기" },
      b: { en: "Do not shower, but wear fresh clothes", ko: "안 씻고 새 옷 입기" }
    },
    {
      id: "hygiene-greasy-photo",
      category: "hygiene",
      a: { en: "Take a group photo on a greasy-hair day", ko: "머리 안 감았는데 갑자기 단체사진 찍기" },
      b: { en: "Walk a long distance right after missing a shower", ko: "샤워 못 했는데 갑자기 오래 걸어야 하기" }
    }
  ];

  window.BalanceDilemmas = { categories, dilemmas };
})();

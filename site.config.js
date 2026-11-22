// JSON-compatible configuration. Start with START_HERE.md.
window.PHOTO_SITE = {
  "brand": {
    "name": "Lumen",
    "subtitle": "所见之集",
    "title": "Lumen｜所见之集",
    "description": "记录自己的旅行与日常。",
    "homeNote": "看见，停留，记下。",
    "footer": "示例图形 · 非摄影作品"
  },
  "authors": {
    "kai": {
      "name": "示例作者",
      "bio": "在这里写下自己的摄影介绍。"
    },
    "friend": {
      "name": "同行者",
      "bio": "第二位作者的介绍。"
    }
  },
  "categories": [
    {
      "name": "山野",
      "en": "LANDSCAPES",
      "theme": "自然",
      "image": "demo-01",
      "desc": "自然与远行",
      "portrait": "demo-02",
      "focus": "50% 50%"
    },
    {
      "name": "城市",
      "en": "CITYSCAPES",
      "theme": "城市",
      "image": "demo-05",
      "desc": "街巷与生活",
      "portrait": "demo-06",
      "focus": "50% 50%"
    },
    {
      "name": "日常",
      "en": "EVERYDAY",
      "theme": "日常",
      "image": "demo-09",
      "desc": "生活与片刻",
      "portrait": "demo-10",
      "focus": "50% 50%"
    },
    {
      "name": "沿途",
      "en": "ON THE ROAD",
      "theme": "",
      "image": "demo-03",
      "desc": "旅程与专题",
      "portrait": "demo-04",
      "focus": "50% 50%"
    }
  ],
  "journeys": {
    "山间": {
      "en": "IN THE HILLS",
      "cover": "demo-01",
      "portrait": "demo-02",
      "intro": "此处是示例旅程，图片是原创占位图。"
    },
    "城中": {
      "en": "IN THE CITY",
      "cover": "demo-05",
      "intro": "替换为自己的旅行手记。"
    },
    "日常": {
      "en": "EVERYDAY",
      "cover": "demo-09",
      "intro": "替换为生活中的片刻。"
    }
  },
  "essays": [
    {
      "id": "demo-light",
      "author": "kai",
      "title": "光的练习",
      "en": "Studies of Light",
      "coverPhotoId": "demo-01",
      "photoIds": [
        "demo-01",
        "demo-02",
        "demo-03",
        "demo-04",
        "demo-05",
        "demo-06",
        "demo-07",
        "demo-08"
      ]
    }
  ],
  "about": {
    "heading": "ABOUT",
    "intro": "在自己的生活里，寻找值得停留的画面。",
    "portrait": "",
    "sections": [
      {
        "title": "我所看见的",
        "en": "HOW I SEE",
        "text": "这里写你的观看方式。",
        "image": "demo-01"
      },
      {
        "title": "旅行与日常",
        "en": "ON THE ROAD",
        "text": "这里写你的旅行与生活。",
        "image": "demo-05"
      }
    ]
  },
  "map": {
    "attribution": "原创省级地区索引示意，非地理边界；省份分配仅为功能演示。",
    "sourceUrl": "",
    "covers": {}
  },
  "features": {
    "map": true,
    "secondAuthor": true,
    "metadata": true,
    "fieldNotes": true,
    "frames": true,
    "further": true
  },
  "contact": {
    "email": "",
    "socialLabel": "",
    "socialUrl": ""
  },
  "fieldNotes": {
    "demo-03": "示例手记：在这里写下一张照片背后的感受。此图为原创占位图，不是真实拍摄记录。"
  },
  "further": {
    "kai": [
      {
        "place": "山间",
        "next": "城中",
        "coverPhotoId": "demo-05"
      },
      {
        "place": "城中",
        "next": "日常",
        "coverPhotoId": "demo-09"
      },
      {
        "place": "日常",
        "next": "山间",
        "coverPhotoId": "demo-01"
      }
    ]
  }
};

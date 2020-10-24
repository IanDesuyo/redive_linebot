const NoteMessage = {
  type: "bubble",
  body: {
    type: "box",
    layout: "vertical",
    contents: [
      {
        type: "text",
        text: "注意事項！",
        weight: "bold",
      },
      {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "當日出完刀的玩家",
          },
          {
            type: "text",
            text: "使用 #三刀出完 指令",
          },
          {
            type: "text",
            text: "進行狀態回報",
          },
          {
            type: "text",
            text: "回報後無法修改",
          },
          {
            type: "text",
            text: "如真的需重置，請輸入 #三刀重置",
          },
        ],
        paddingAll: "5px",
      },
      {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "需要求救的玩家",
          },
          {
            type: "text",
            text: "使用 #出完沒 日期(選填) 指令",
          },
          {
            type: "text",
            text: "可列出回報清單",
          },
        ],
        paddingAll: "5px",
      },
    ],
  },
};
const liffGuildUri = `https://liff.line.me/1654464491-42ME7MYm`;
const liffPuddingUri = `https://liff.line.me/${process.env.LINE_LIFF_ID}`;
exports.showBattleList = (context, data) => {
  context.sendFlex(`第${data.week}周次 - 戰隊清單`, {
    type: "carousel",
    contents: [
      genPreviewCover(data),
      genPreviewDetail({
        ...data.records[0],
        boss: 1,
        formId: data.formId,
        week: data.week,
        datas: data.datas.filter(data => data.boss === 1),
        config: data.configs.find(config => config.boss == 1),
      }),
      genPreviewDetail({
        ...data.records[1],
        boss: 2,
        formId: data.formId,
        week: data.week,
        datas: data.datas.filter(data => data.boss === 2),
        config: data.configs.find(config => config.boss == 2),
      }),
      genPreviewDetail({
        ...data.records[2],
        boss: 3,
        formId: data.formId,
        week: data.week,
        datas: data.datas.filter(data => data.boss === 3),
        config: data.configs.find(config => config.boss == 3),
      }),
      genPreviewDetail({
        ...data.records[3],
        boss: 4,
        formId: data.formId,
        week: data.week,
        datas: data.datas.filter(data => data.boss === 4),
        config: data.configs.find(config => config.boss == 4),
      }),
      genPreviewDetail({
        ...data.records[4],
        boss: 5,
        formId: data.formId,
        week: data.week,
        datas: data.datas.filter(data => data.boss === 5),
        config: data.configs.find(config => config.boss == 5),
      }),
      NoteMessage,
    ],
  });
};

exports.showBattleDetail = (context, data) => {
  let message = {
    type: "carousel",
    contents: [
      genPreviewDetail({
        ...data.records,
        boss: data.boss,
        formId: data.formId,
        week: data.week,
        datas: data.datas,
        config: data.configs.find(config => config.boss == data.boss),
      }),
      NoteMessage,
    ],
  };
  context.sendFlex(`第${data.week}周次${data.boss}王`, message);
};

function genPreviewCover(option) {
  const { week, formId, configs } = option;
  var bossImages = configs.sort((a, b) => a.boss - b.boss).map(config => config.image);
  var defaultImg = "https://i.imgur.com/zsAFota.png";

  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `第${week}周目`,
          wrap: true,
          weight: "bold",
          align: "center",
          size: "lg",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            ...[0, 1, 2, 3, 4].map(index => ({
              type: "image",
              url: bossImages[index] || defaultImg,
            })),
          ],
          spacing: "md",
        },
      ],
    },
    footer: {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "🌏 網站版",
              align: "center",
              weight: "bold",
              color: "#FFFFFF",
            },
          ],
          action: {
            type: "uri",
            uri: `${liffGuildUri}/forms/${formId}/week/${week}`,
          },
          paddingAll: "5px",
          backgroundColor: "#2196f3",
          cornerRadius: "md",
        },
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "🔧 設定頁",
              align: "center",
              weight: "bold",
              color: "#FFFFFF",
            },
          ],
          action: {
            type: "uri",
            uri: `${liffGuildUri}/forms/${formId}/modify`,
          },
          paddingAll: "5px",
          backgroundColor: "#2196f3",
          cornerRadius: "md",
        },
      ],
      spacing: "md",
    },
  };
}

function genPreviewDetail(option) {
  const {
    FullCount,
    NotFullCount,
    KyaryuCount,
    OtherCount,
    boss,
    week,
    datas,
    config,
    formId,
  } = option;

  let bossConfig = { name: `${boss}王`, image: "", ...config };
  bossConfig.image = bossConfig.image || "https://i.imgur.com/zsAFota.png";
  let stage = 0;
  if (week >= 35) {
    stage = 3;
  } else if (week >= 11) {
    stage = 2;
  } else if (week >= 4) {
    stage = 1;
  }
  let hp = bossConfig.hp[stage];

  let recordsDetail = datas.map((data, index) => {
    return {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "text",
          text: `${index + 1}`,
          flex: 2,
        },
        {
          type: "text",
          text: `${data.user.name}`,
          flex: 3,
        },
        {
          type: "text",
          text: `${getStatusText(data.status)}`,
          flex: 3,
        },
        {
          type: "text",
          text: "取消",
          flex: 3,
          color: "#880000",
          action: {
            type: "postback",
            data: JSON.stringify({
              action: "battleCancel",
              week: week,
              boss: boss,
              recordId: data.id,
            }),
          },
        },
      ],
    };
  });

  return {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "image",
              url: bossConfig.image,
              flex: 5,
              gravity: "bottom",
              action: {
                type: "uri",
                uri: `https://guild.randosoru.me/forms/${formId}/week/${week}`,
              },
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: `${week}周 - ${bossConfig.name}`,
                  weight: "bold",
                  align: "center",
                  wrap: true,
                },
                {
                  type: "text",
                  contents: [
                    {
                      type: "span",
                      text: "完整",
                      weight: "bold",
                    },
                    {
                      type: "span",
                      text: " ",
                    },
                    {
                      type: "span",
                      text: `${FullCount}`,
                    },
                  ],
                },
                {
                  type: "text",
                  contents: [
                    {
                      type: "span",
                      text: "補償",
                      weight: "bold",
                    },
                    {
                      type: "span",
                      text: " ",
                    },
                    {
                      type: "span",
                      text: `${NotFullCount}`,
                    },
                  ],
                },
                {
                  type: "text",
                  contents: [
                    {
                      type: "span",
                      text: "凱留",
                      weight: "bold",
                    },
                    {
                      type: "span",
                      text: " ",
                    },
                    {
                      type: "span",
                      text: `${KyaryuCount}`,
                    },
                  ],
                },
                {
                  type: "text",
                  contents: [
                    {
                      type: "span",
                      text: "其他",
                      weight: "bold",
                    },
                    {
                      type: "span",
                      text: " ",
                    },
                    {
                      type: "span",
                      text: `${OtherCount}`,
                    },
                  ],
                },
              ],
              flex: 7,
              spacing: "xs",
              paddingStart: "6px",
            },
          ],
          margin: "sm",
          paddingAll: "2px",
        },
        {
          type: "box",
          paddingAll: "5px",
          layout: "vertical",
          contents: [
            {
              type: "text",
              size: "sm",
              contents: [],
              text: "100%",
              align: "end",
            },
            {
              type: "box",
              layout: "vertical",
              contents: [],
              backgroundColor: "#FF0000AA",
              height: "5px",
            },
            {
              type: "text",
              text: `${hp}`,
              size: "sm",
              align: "end",
            },
          ],
        },
        {
          type: "separator",
          margin: "sm",
          color: "#808080",
        },
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: "完整",
                      align: "center",
                      action: {
                        type: "postback",
                        data: JSON.stringify({
                          action: "battleSignUp",
                          week: week,
                          boss: boss,
                          type: 1,
                        }),
                      },
                    },
                  ],
                  backgroundColor: "#99ff33",
                  height: "26px",
                  paddingAll: "2px",
                },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: "補償",
                      align: "center",
                      action: {
                        type: "postback",
                        data: JSON.stringify({
                          action: "battleSignUp",
                          week: week,
                          boss: boss,
                          type: 2,
                        }),
                      },
                    },
                  ],
                  backgroundColor: "#66ccff",
                  height: "26px",
                  paddingAll: "2px",
                },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: "凱留",
                      align: "center",
                      action: {
                        type: "postback",
                        data: JSON.stringify({
                          action: "battleSignUp",
                          week: week,
                          boss: boss,
                          type: 3,
                        }),
                      },
                    },
                  ],
                  backgroundColor: "#cc66ff",
                  height: "26px",
                  paddingAll: "2px",
                },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: "其他",
                      align: "center",
                      action: {
                        type: "uri",
                        uri: `${liffPuddingUri}/Panel/Group/Battle?week=${week}&boss=${boss}`,
                      },
                    },
                  ],
                  backgroundColor: "#808080",
                  height: "26px",
                  paddingAll: "2px",
                },
              ],
              borderWidth: "2px",
              borderColor: "#000000",
              cornerRadius: "5px",
            },
          ],
          margin: "md",
          paddingAll: "3px",
        },
        {
          type: "separator",
          margin: "sm",
          color: "#808080",
        },
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "#",
                      flex: 2,
                    },
                    {
                      type: "text",
                      text: "名稱",
                      flex: 3,
                    },
                    {
                      type: "text",
                      text: "類型",
                      flex: 3,
                    },
                    {
                      type: "text",
                      text: "操作",
                      flex: 3,
                    },
                  ],
                },
                ...recordsDetail,
              ],
              spacing: "sm",
              paddingAll: "2px",
            },
          ],
          margin: "md",
          spacing: "sm",
        },
      ],
    },
  };
}

function getStatusText(status) {
  switch (status) {
    case 1:
      return "完整";
    case 2:
      return "補償";
    case 3:
      return "凱留";
    default:
      return "其他";
  }
}

/**
 * 顯示完成出刀列表
 * @param {Context} context
 * @param {Object[]} FinishMemberList
 * @param {String} FinishMemberList[].displayName
 * @param {String} FinishMemberList[].createDTM
 * @param {Boolean} FinishMemberList[].isSignin
 */
exports.showFinishList = (context, FinishMemberList) => {
  let date = new Date();
  const Today = [
    date.getFullYear(),
    ("0" + (date.getMonth() + 1)).substr(-2),
    ("0" + date.getDate()).substr(-2),
  ].join(".");
  let isSignList = FinishMemberList.filter(list => list.isSignin);
  let notSignList = FinishMemberList.filter(list => !list.isSignin);
  context.sendFlex("出刀簽到表", {
    type: "carousel",
    contents: [
      {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "🏆成功人士",
              weight: "bold",
              color: "#9B1C31",
            },
          ],
          backgroundColor: "#80C5DE",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "姓名",
                  weight: "bold",
                  flex: 7,
                },
                {
                  type: "text",
                  text: "時間",
                  weight: "bold",
                  flex: 5,
                },
              ],
            },
            ...isSignList.map(genMemberRow),
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "separator",
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: `總計${isSignList.length}位`,
                  size: "xs",
                  align: "start",
                  flex: 3,
                },
                {
                  type: "text",
                  text: `${Today} Generated by 布丁機器人`,
                  align: "end",
                  color: "#808080",
                  size: "xs",
                  margin: "sm",
                  flex: 9,
                },
              ],
            },
          ],
        },
      },
      {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "🎮出刀機器",
              weight: "bold",
              color: "#FEFEFE",
            },
          ],
          backgroundColor: "#9B1C31",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "姓名",
                  weight: "bold",
                  flex: 7,
                },
                {
                  type: "text",
                  text: "時間",
                  weight: "bold",
                  flex: 5,
                },
              ],
            },
            ...notSignList.map(genMemberRow),
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "separator",
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: `總計${notSignList.length}位`,
                  size: "xs",
                  align: "start",
                  flex: 3,
                },
                {
                  type: "text",
                  text: `${Today} Generated by 布丁機器人`,
                  align: "end",
                  color: "#808080",
                  size: "xs",
                  margin: "sm",
                  flex: 9,
                },
              ],
            },
          ],
        },
      },
    ],
  });
};

function genMemberRow(memberData) {
  let date,
    strDate = "-";
  if (memberData.createDTM) {
    date = new Date(memberData.createDTM);
    strDate =
      [("0" + (date.getMonth() + 1)).substr(-2), date.getDate()].join("/") +
      " " +
      [("0" + date.getHours()).substr(-2), ("0" + date.getMinutes()).substr(-2)].join(":");
  }

  return {
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "text",
        text: memberData.displayName || "路人甲",
        flex: 7,
      },
      {
        type: "text",
        text: strDate,
        flex: 5,
      },
    ],
  };
}

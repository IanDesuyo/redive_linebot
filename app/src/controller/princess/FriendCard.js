const uidModel = require("../../model/princess/uid");
const FriendCardTemplate = require("../../templates/princess/FriendCard");

exports.showCard = async context => {
  let { userId } = context.event.source;
  let bindData = {};

  try {
    bindData = await uidModel.getIanProfileData(userId);
  } catch (err) {
    context.replyText("資料獲取失敗..請稍後再試");
    return;
  }

  let serverName = ["美食殿堂", "真步真步王國", "破曉之星", "小小甜心"];

  if (Object.keys(bindData).length === 0) {
    FriendCardTemplate.showBindingPage(context);
    return;
  }

  bindData.server = serverName[bindData.server - 1];

  FriendCardTemplate.showCard(context, bindData);
};

exports.api = {};

exports.api.getData = async (req, res) => {
  let { userId } = req.profile;
  let bindData = await uidModel.getData(userId);

  let result = bindData || {};

  res.json(result);
};

exports.api.binding = async (req, res) => {
  let { uid, server, background } = req.body;
  let { userId } = req.profile;

  let nickname = await uidModel.getPrincessNickName(uid, server);
  if (!nickname) {
    res.status(400).json({ message: "綁定失敗，請確認uid與伺服器是否正確！" });
    return;
  }

  let result = await uidModel.binding({ uid, userId, server, background }).catch(() => false);

  if (result === false) {
    res.status(401).json({ message: "binding failed" });
    return;
  }

  res.status(201).json({});
};

exports.api.clearBinding = async (req, res) => {
  let { userId } = req.profile;
  let result = await uidModel.cleanBinding(userId).catch(() => false);

  if (result === false) {
    res.status(401).json({ message: "reset failed" });
    return;
  }

  res.json({});
};

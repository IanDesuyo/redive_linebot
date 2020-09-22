const mysql = require("../../../util/mysql");
const fetch = require("node-fetch");
const token = process.env.IAN_BATTLE_TOKEN;
const headers = { "x-token": token, "user-agent": "re:dive line-bot" };
const apiURL = "https://guild.randosoru.me/api";
const redis = require("../../../util/redis");

exports.saveIanUserData = (platform = 2, userId, ianUserId) => {
  return mysql
    .insert({
      platform: platform,
      userId: userId,
      ianUserId: ianUserId,
      createDTM: new Date().getTime(),
    })
    .into("IanUser");
};

exports.isRegister = (platform, userId) => {
  return mysql
    .select("*")
    .where({
      platform: platform,
      userId: userId,
    })
    .from("IanUser");
};

exports.getIanUserData = (platform, userId) => this.isRegister(platform, userId);

exports.getFormId = (guildId, month) => {
  return mysql
    .select("*")
    .from("GuildBattle")
    .where({ guildId, month })
    .then(res => (res.length === 0 ? false : res[0].FormId));
};

/**
 * 設定群組的報名表ID
 * @param {String} guildId
 * @param {String} formId
 * @param {String} month
 */
exports.setFormId = (guildId, formId, month) => {
  return mysql
    .insert({
      guildId,
      formId,
      month,
    })
    .into("GuildBattle")
    .then();
};

exports.Ian = {};

/**
 * 向Ian戰隊系統註冊會員
 * @param {Number} platform 平台 1:discord, 2:line
 * @param {String} userId
 * @param {String} name 顯示姓名
 * @param {String} avatar 顯示頭像
 */
exports.Ian.RegisterUser = (platform = 2, userId, name, avatar = "") => {
  return doPost("/bot/register", {
    platform: platform,
    user_id: userId,
    avatar: avatar,
    name: name,
  });
};

exports.Ian.isRegister = (platform, userId) => {
  return doGet(`/bot/isRegister?platform=${platform}&user_id=${userId}`);
};

exports.Ian.createForm = (ianUserId, month, title = "") => {
  return doPost(`/bot/forms/create?user_id=${ianUserId}`, {
    month: month,
    title: title,
  });
};

exports.Ian.getFormRecords = (formId, week, boss) => {
  if (boss === undefined) return doGet(`/forms/${formId}/week/${week}`);
  return doGet(`/forms/${formId}/week/${week}/boss/${boss}`);
};

/**
 *
 * @param {String} formId
 * @param {Number} week
 * @param {Number} boss
 * @param {String} ianUserId
 * @param {Object} option
 * @param {Object} option.status 狀態：1 正式，2 補償，3 凱留，11 戰鬥中，12 等待中，13 等待tag，21 完成(正式)，22 完成(補償)，23 暴死，24 求救
 * @param {Object} option.damage 傷害
 * @param {Object} option.comment 備註
 */
exports.Ian.setRecord = (formId, week, boss, ianUserId, option) => {
  return doPost(`/bot/forms/${formId}/week/${week}/boss/${boss}?user_id=${ianUserId}`, option);
};

/**
 * 取得報名表設定
 * @param {String} formId
 */
exports.Ian.getFormConfig = formId => {
  return doGet(`/forms/${formId}`);
};

function doGet(path) {
  console.log(path);
  return fetch(`${apiURL}${path}`, {
    headers: headers,
  })
    .then(IsIanSeverDown)
    .then(res => res.json());
}

function doPost(path, data) {
  return fetch(`${apiURL}${path}`, {
    headers: headers,
    body: JSON.stringify(data),
    method: "post",
  })
    .then(IsIanSeverDown)
    .then(res => res.json())
    .then(json => {
      console.log(path);
      console.timeEnd("doPost");
      return json;
    });
}

/**
 * 暫時全域設定Ian系統維修中
 */
function IsIanSeverDown(response) {
  if (response.ok === false) {
    redis.set("GuildBattleSystem", false, 1 * 60);
  }

  return response;
}

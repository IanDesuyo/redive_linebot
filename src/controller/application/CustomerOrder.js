const CustomerOrderModel = require("../../model/application/CustomerOrder");
const minimist = require("minimist");
const md5 = require("md5");
const random = require("math-random");
const CustomerOrderTemplate = require("../../templates/application/CustomerOrder");
const { send } = require("../../templates/application/Order");
const { recordSign } = require("../../util/traffic");

function CusOrderException(message, code = 0) {
  this.message = message;
  this.name = "CusOrderException";
  this.code = code;
}

/**
 * 進行回復內容分析，可分析文字或圖片連結
 * @param {String} strReply
 * @return {Object}
 */
function initialReply(strReply) {
  var replyDatas = strReply
    .split(/\|/)
    .filter(reply => reply.trim() !== "")
    .map(reply => {
      if (/^https:.*?(jpg|jpeg|tiff|png)$/i.test(reply) == true) {
        return {
          type: "image",
          data: reply,
        };
      } else {
        return {
          type: "text",
          data: reply,
        };
      }
    });

  return replyDatas;
}

/**
 * 是否為重複指令
 * @param {String} orderKey 指令辨識金鑰
 * @param {String} sourceId 來源辨識代號
 * @return {Promise}    Boolean
 */
async function isRepeatOrder(orderKey, sourceId) {
  return (await CustomerOrderModel.queryOrderByKey(orderKey, sourceId)) !== undefined;
}

/**
 * 分析參數是否包含Sender
 * @param {Object} param
 * @return {Object} sender
 */
function handleSender(param) {
  let sender = {};

  if (param.sender === undefined) return sender;

  let { sender: paraSender } = param;

  if (Array.isArray(paraSender) === true) {
    paraSender.forEach(para => {
      if (isImage(para) === true) {
        sender.iconUrl = para;
      } else if (isName(para) === true) {
        sender.name = para;
      }
    });
  } else {
    if (isImage(paraSender) === true) {
      sender.iconUrl = paraSender;
    } else if (isName(paraSender) === true) {
      sender.name = paraSender;
    }
  }

  return sender;

  function isImage(url) {
    return /^https:.*?(jpg|jpeg|tiff|png)$/i.test(url);
  }
  function isName(name) {
    return name.length <= 20 && name.indexOf("http") === -1;
  }
}

/**
 * 新增自訂指令
 * @param {Context} context
 * @param {Object} props
 * @param {Number} touchType 觸發類型，1:完全符合，2:部分符合
 */
exports.insertCustomerOrder = async (context, props, touchType = 1) => {
  try {
    recordSign("insertCustomerOrder");
    const param = minimist(context.event.message.text.split(/\s+/));

    var [prefix, order] = param._;
    var reply = context.event.message.text.replace(prefix, "").replace(order, "").trim();
    var [sourceId, userId] = getSourceId(context);

    if (order === undefined || reply === undefined) {
      CustomerOrderTemplate[context.platform].showInsertManual(context);
      return;
    }

    reply = reply.toString();

    var replyDatas = initialReply(reply);
    var { name, iconUrl } = handleSender(param);
    var orderKey = md5(order + reply + touchType);

    if ((await isRepeatOrder(orderKey, sourceId)) === true)
      throw new CusOrderException("指令已存在，請勿重複新增");

    await Promise.all(
      replyDatas.map((data, index) =>
        CustomerOrderModel.insertOrder({
          NO: index,
          SOURCE_ID: sourceId,
          ORDER_KEY: orderKey,
          CUSORDER: order,
          TOUCH_TYPE: touchType,
          MESSAGE_TYPE: data.type,
          REPLY: data.data,
          CREATE_DTM: new Date().getTime(),
          CREATE_USER: userId,
          MODIFY_USER: userId,
          SENDER_NAME: name,
          SENDER_ICON: iconUrl,
        })
      )
    );

    context.sendText(`${order} 新增成功`);
  } catch (e) {
    if (e.name === "CusOrderException") {
      context.sendText(e.message);
    } else {
      // keep throw
      throw e;
    }
  }
};

/**
 * 取得資料用ID
 * @param {Context} context
 * @returns {Array} [sourceId, userId]
 */
function getSourceId(context) {
  switch (context.platform) {
    case "line": {
      let { groupId, roomId, userId } = context.event.source;
      return [groupId || roomId || userId, userId];
    }
    case "telegram":
      return [context.event.message.chat.id, context.event.message.from.id];
    case "console":
      return ["admin", "admin"];
    default:
      return [];
  }
}

/**
 * 辨識訊息是否為自訂指令
 * @param {Context} context
 */
exports.CustomerOrderDetect = async context => {
  var [sourceId] = getSourceId(context);
  var orderDatas = await CustomerOrderModel.queryOrderBySourceId(sourceId, 1);

  // 尚未建立任何指令
  if (orderDatas.length === 0) return false;

  var chosenOrderKey = chooseOrder(orderDatas);

  if (chosenOrderKey === false) return false;
  recordSign("CustomerOrderDetect");
  // 紀錄最近一次觸發時間，用於日後回收無用處之指令。
  CustomerOrderModel.touchOrder(context.event.message.text, sourceId);

  send(
    context,
    orderDatas.filter(data => data.orderKey === chosenOrderKey)
  );

  /**
   * 挑選指令，挑選規則如下
   * 1. 全符合優先
   * 2. 多指令隨機挑選
   */
  function chooseOrder() {
    let message = context.event.message.text.trim();
    // 優先取用全符合指令
    let fullMatches = orderDatas.filter(
      data => data.touchType === "1" && data.cusOrder === message
    );

    if (fullMatches.length !== 0) {
      let fullKeys = trimRepeat(fullMatches.map(data => data.orderKey));
      return fullKeys[getRandom(fullKeys.length - 1, 0)];
    }

    let partMatches = orderDatas.filter(
      data => data.touchType === "2" && message.indexOf(data.cusOrder) !== -1
    );

    if (partMatches.length !== 0) {
      let partKeys = trimRepeat(partMatches.map(data => data.orderKey));
      return partKeys[getRandom(partKeys.length - 1, 0)];
    }

    return false;
  }
};

/**
 * Distinct Array
 * @param {Array} a
 */
function trimRepeat(a) {
  return a.filter((data, index, selfAry) => selfAry.indexOf(data) === index);
}

/**
 * Generate Random number between max and min.
 * @param {Number} max
 * @param {Number} min
 */
function getRandom(max, min) {
  if (min > max) {
    let temp;
    temp = min;
    min = max;
    max = temp;
  }

  let result = Math.round(random() * (max - min) + min);
  return result;
}

/**
 * 移除自訂指令
 * @param {Context} context
 * @param {Object} props
 * @param {Number} touchType
 */
exports.deleteCustomerOrder = async (context, { match }) => {
  try {
    recordSign("deleteCustomerOrder");
    const { order, orderKey } = match.groups;
    if (order === undefined) {
      CustomerOrderTemplate[context.platform].showDeleteManual(context);
      return;
    }

    var [sourceId, userId] = getSourceId(context);

    var deleteOrders = await CustomerOrderModel.queryOrderToDelete(order, sourceId);

    if (deleteOrders.length === 0) throw new CusOrderException(`未搜尋到"${order}"的指令`);
    var { orderKey: key } = autoComplete(orderKey, deleteOrders);
    // 剛好只有一筆符合刪除條件
    if (deleteOrders.length === 1 || key !== undefined) {
      await CustomerOrderModel.setStatus(
        {
          orderKey: key || deleteOrders[0].orderKey,
          sourceId: sourceId,
          modifyUser: userId,
        },
        0
      );

      context.sendText(`"${order}"刪除成功！`);
      return;
    }

    // 需列出清單，請使用者指定
    CustomerOrderTemplate[context.platform].showDeleteOption(context, deleteOrders);
  } catch (e) {
    if (e.name === "CusOrderException") {
      context.sendText(e.message);
    } else throw e;
  }
};

/**
 * 自動補上完整金鑰
 * @param {String} orderKey
 * @param {Array} deleteOrders
 */
function autoComplete(orderKey, deleteOrders) {
  let findResult = deleteOrders.find(data => data.orderKey.indexOf(orderKey) === 0);
  return findResult || {};
}

exports.fetchCustomerOrders = async (req, res) => {
  const { sourceId } = req.params;
  var orderDatas = await CustomerOrderModel.queryOrderBySourceId(sourceId);

  let userIds = [];
  orderDatas.forEach(data => {
    userIds.push(data.createUser);
    userIds.push(data.modifyUser);
  });

  orderDatas = orderDatas.map(data => {
    return {
      ...data,
      createTS: new Date(parseInt(data.createDTM)).getTime(),
    };
  });
  res.json(orderDatas);
};

exports.updateOrder = (req, res) => {
  const { sourceId } = req.params;

  try {
    if (/^[CRU][a-f0-9]{32}$/.test(sourceId) === false)
      throw new CusOrderException("Invalid Source ID", 1);
    var updateResult = CustomerOrderModel.updateOrder(sourceId, req.body);
    if (updateResult === false) throw new CusOrderException("Update Failed", 2);

    res.json({});
  } catch (e) {
    if (e.name === "CusOrderException") {
      res.json({
        status: "fail",
        errMsg: e.message,
        code: e.code,
      });
    } else throw e;
  }
};

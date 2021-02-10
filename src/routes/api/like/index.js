const { Router } = require("express");
const { auth } = require("@utils/discordApi");
const Bots = require("@models/bots");
const Users = require("@models/users");
const { server } = require("@root/config.json")

const route = Router();

route.patch("/:id", auth, async (req, res) => {
  let user = await Users.findOne({ userid: req.user.id })
  if (user && (Date.now() - user.time) < 43200000) 
    return res.json({success: false, time: Date.now() - user.time})

  await Bots.updateOne({ botid: req.params.id }, { $inc: { likes: 1 } })
  await Users.updateOne({ userid: req.user.id }, { $set: { time: Date.now(), botliked: req.params.id } }, { upsert: true })

  let userProfile = await req.app.get('client').users.fetch(req.user.id);
  
  let channel = await req.app.get('client').channels.cache.get(server.like_log);
  let webhook = (await channel.fetchWebhooks()).first();
  if (!webhook) 
    webhook = await channel.createWebhook('Like A Bot')
  await webhook.send(`<@${req.user.id}> (${userProfile.tag}) liked <@${req.params.id}>`);
  return res.json({ success: true })
});

module.exports = route;

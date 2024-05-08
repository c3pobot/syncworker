'use strict'
const log = require('logger')
const mongo = require('mongoclient')

let logLevel = process.env.LOG_LEVEL || log.Level.INFO;
log.setLevel('debug')

const rabbitmq = require('./helpers/rabbitmq')
const swgohClient = require('./swgohClient')
const gameDataList = require('./helpers/gameDataList')

require('./exchanges')
const POD_NAME = process.env.POD_NAME || 'sync-worker'

let cmdQue = require('./cmdQue')
const checkRabbitmq = ()=>{
  try{
    if(rabbitmq.ready){
      checkMongo()
      return
    }
    setTimeout(checkRabbitmq, 5000)
  }catch(e){
    log.error(e)
    setTimeout(checkRabbitmq, 5000)
  }
}
const checkMongo = ()=>{
  try{
    let status = mongo.status()
    if(status){
      checkAPIReady()
      return
    }
    setTimeout(checkMongo, 5000)
  }catch(e){
    log.error(e)
    setTimeout(checkMongo, 5000)
  }
}
const checkAPIReady = async()=>{
  try{
    let obj = await swgohClient('metadata')
    if(obj?.latestGamedataVersion){
      log.info('API is ready ..')
      checkGameData()
      return
    }
    log.info('API is not ready. Will try again in 5 seconds')
    setTimeout(checkAPIReady, 5000)
  }catch(e){
    log.error(e)
    setTimeout(checkAPIReady, 5000)
  }
}
const checkGameData = async()=>{
  try{
    let status = gameDataList.status()
    if(status){
      await cmdQue.start()
      return
    }
    setTimeout(checkGameData, 5000)
  }catch(e){
    log.error(e)
    setTimeout(checkGameData, 5000)
  }
}
checkRabbitmq()

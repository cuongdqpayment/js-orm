"use strict"
/**
 * v3.0
 * linkify to promise [{urlInfo}]
 * 22/06/2019
 * 
 * v2.0
 * Biện dịch trả về linkify 
 * {
 * urls:      //array liên kết lấy được
 * , user_infors: //array đã dịch được các liên kết urls
 * 
 * cuongdq v1.0 
 * 23/05/2019
 * 
 * chuyển đổi content thành content chứa html
 * chuyển đổi url web link (http) thành nội dung chứa title, content, ảnh lấy được theo link
 * chuyển đổi 
 */

const request = require('request');
const cheerio = require('cheerio');

/**
 * Chuyển đổi link thành hostname, url, title, alt, image, và  images
 * 
 */
const getContentUrl = (urlLink)=>{

    return new Promise(resolve=>{

        let domain = (/([\w-]+\.)+[\w-]+/).exec(urlLink);
        var $hostname = domain?domain[0]:undefined;

        request( urlLink, 
            (error, response, body) => {
             if (!error && response.statusCode == 200) {
               const $ = cheerio.load(body);
               let $title = $( "title" ).text().trim();
               if (!$title||$title==""){
                   $( "p" ).each( (i, el ) => {
                     if (!$title||$title=="") $title= $(el).text();
                     if ($title) $title= $title.trim();
                     if ($title.length>10) return true;
                   });
               }
               
               let $content ="";
               $( "p" ).each( (i, el ) => {
                if ($(el).text()) $content += $(el).text().trim() + "\n";
                if ($content.length>1500) return true;
              });                                               
    
               let $src,$alt;
               let $srcs = [];
               $( "img" ).each( (i, el ) => {
                   let src = $(el).attr('src');
                   let alt = $(el).attr('alt');
                   if (alt) alt = alt.trim();
                   let ext = src.replace(/^.*\./, '');
                   if (ext&&ext.toLowerCase()==='jpg'){
                       if (!$src||!$alt){
                           $src = src;
                           $alt = alt;
                       }
                       $srcs.push({src:src,alt: alt})
                   }
               });
               
               resolve({
                   hostname: $hostname,
                   url: urlLink,
                   title: $title,
                   image: $src,
                   alt : $alt,
                   content: $content,
                   images: $srcs
               });

            } else {
                resolve({
                    error: error
                });
            }
        });
    })
}


const getNewLineHtml = (value)=>{
    if (value) value = value.replace(/(?:\r\n|\r|\n)/g, '<br />');
    return value;
}

 /**
  * đưa vào giá trị không có thẻ html
  * chuyển đổi thành nội dung có thẻ html
  * chứa các liên kết nếu nội dung đưa vào có các url, domain, và link
  * 
  * @param {*} value 
  * output: {content:,url:[],details:[]}
  */
const linkify = (value)=>{

    let valueLinkify = value;
    let links = [];
    let urlInfos = [];

    let regexDomain = /([\w-]+\.)+[\w-]+/;
    let isHtmlHref = ( !valueLinkify || valueLinkify.indexOf("<a ")<0 || valueLinkify.indexOf("<A ")<0 )
    
    return new Promise(async resolve =>
        {
        if (valueLinkify){
            //URLs starting with http://, https://, or ftp://    
            valueLinkify = valueLinkify.replace(/(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim
                , 
                function (url) {
                    let domain = regexDomain.exec(url);
                    let hostname = domain?domain[0]:undefined;
                    if (hostname&&url){
                        links.push({hostname,url});
                        return isHtmlHref?" <a href='"+url+"' target='_blank'>" + (url.length>30?hostname:url) + "</a>":url;
                    }
                }
            );
    
            //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
            valueLinkify = valueLinkify.replace(/([ ])([\w-]+\.[\S]+(\b|$))/gim
                , 
                function (url) {
                    var domain = regexDomain.exec(url);
                    let hostname = domain?domain[0]:undefined;
                    if (hostname&&url){
                    links.push({hostname,url:'http://'+url.trim()});
                    return isHtmlHref?" <a href='http://"+url.trim()+"' target='_blank'>" + (url.length>20?hostname:"http://"+url) + "</a>":url;
                    }
                }
            );
    
            //Change email addresses to mailto:: links.
            valueLinkify = valueLinkify.replace(/(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim
                ,
                function (url) {
                    var domain = regexDomain.exec(url);
                    let hostname = domain?domain[0]:undefined;
                    if (hostname){
                        links.push({hostname,url:'mailto:'+url});
                        return isHtmlHref?"<a href='mailto:"+url+"' target='_blank'>" + url + "</a>":url;
                    }
                }
            );
        }
    
        for (let i=0;i<links.length;i++){
            let el=links[i];
            try{
                if (el.url&&el.url.toLowerCase().indexOf("http")===0){
                    let urlInfo = await getContentUrl(el.url);
                    urlInfos.push(urlInfo);
                }
            }catch(e){}
        }
    
    resolve(
        urlInfos //danh sách chi tiết nội dung đã dịch được
        )
    })

}


module.exports = {
    linkify: linkify //chuyển đổi nội dung thuần thành đối tượng chứa nội dung html có liên kết đính kèm
    , getNewLineHtml: getNewLineHtml //chuyển đổi các ký tự xuống dòng thành <br> trong html
    , getContentUrl: getContentUrl //chuyển đổi một link thuần thành đối tượng chứa thông tin được đọc từ link (như facebook, viber) trên môi trường server
};
const express = require('express');
const router = express.Router();
const controller = require('./controller');

const modName = "file_analysis";

/**
 * Search files by filename
 * POST /api/fileanalysis/search
 */
router.post('/search', async (req, res) => {
    try {
        const result = await controller.searchFiles({
            body: req.body
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message || error
        });
    }
});


/**
 * Search file by name and analyze with AI
 * POST /api/fileanalysis/search-analyze
 */
router.post('/search-analyze',  function (req, res, next) {
    controller.searchAndAnalyze(req).then(d => {
        return d
    }).catch(err => {
       throw err;
    });
});

/**
 * Analyze specific file by filepath
 * POST /api/fileanalysis/analyze
 */
router.post('/analyze-files', async function (req, res, next) {
   try {
      const result = await controller.analyzeFiles(req);
      res.json(result);
   } catch (error) {
       res.status(500).json({
           status: "error",
           message: error.message || error
       });
   }
});

module.exports = router;
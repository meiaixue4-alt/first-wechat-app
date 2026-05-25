const { IDENTITY_OPTIONS } = require('../../config/constants')

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    tipId: {
      type: String,
      value: ''
    }
  },

  data: {
    reason: '',
    identity: '',
    attachment: '',
    closing: false,
    identityOptions: IDENTITY_OPTIONS
  },

  observers: {
    visible(newVal) {
      if (newVal) {
        this.setData({ reason: '', identity: '', attachment: '', closing: false })
      }
    }
  },

  methods: {
    onReasonInput(e) {
      this.setData({ reason: e.detail.value })
    },

    onIdentityTap(e) {
      const val = e.currentTarget.dataset.value
      this.setData({ identity: this.data.identity === val ? '' : val })
    },

    onAddAttachment() {
      wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.setData({ attachment: res.tempFilePaths[0] })
        }
      })
    },

    onRemoveAttachment() {
      this.setData({ attachment: '' })
    },

    onOverlayTap() {
      this.close()
    },

    onCancel() {
      this.close()
    },

    close() {
      this.setData({ closing: true })
    },

    onAnimationEnd() {
      if (this.data.closing) {
        this.setData({ closing: false })
        this.triggerEvent('cancel')
      }
    },

    onSubmit() {
      const reason = this.data.reason.trim()
      if (!reason) {
        wx.showToast({ title: '请填写质疑理由', icon: 'none', duration: 1500 })
        return
      }
      this.triggerEvent('submit', {
        tipId: this.properties.tipId,
        reason,
        identity: this.data.identity || null,
        attachment: this.data.attachment || null
      })
    }
  }
})

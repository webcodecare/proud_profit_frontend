import { Shield, TrendingUp, Users, Zap } from 'lucide-react'
import React from 'react'

function Features() {
  return (
     <section className="py-20 bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Choose{" "}
              <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
                Proud Profits?
              </span>
            </h2>
            <p className="text-xl text-white/80">Advanced tools and insights for professional crypto trading</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gradient-to-br from-slate-800/30 to-blue-800/30 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-orange-500/50 transition-all">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Cycle Analysis</h3>
              <p className="text-white/70">
                Advanced market cycle analysis with proven historical accuracy for optimal timing.
              </p>
            </div>
            <div className="bg-gradient-to-br from-slate-800/30 to-slate-700/30 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-blue-500/50 transition-all">
              <div className="w-12 h-12 bg-gradient-to-r from-slate-500 to-blue-500 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Risk Management</h3>
              <p className="text-white/70">Professional risk management tools and position sizing strategies.</p>
            </div>
            <div className="bg-gradient-to-br from-green-800/30 to-emerald-800/30 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Real-time Alerts</h3>
              <p className="text-white/70">Instant notifications when market conditions align with our indicators.</p>
            </div>
            <div className="bg-gradient-to-br from-red-800/30 to-red-700/30 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-red-500/50 transition-all">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Expert Community</h3>
              <p className="text-white/70">Join a community of successful traders sharing insights and strategies.</p>
            </div>
          </div>
        </div>
      </section>
  )
}

export default Features